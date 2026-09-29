"""
Training Script for Radar Transformer Deinterleaver
Optimized for Apple Silicon M4 GPU (MPS)
"""

import os
import sys
import time
import json
import argparse
import numpy as np
import torch
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.dataset import get_dataloaders
from backend.models import RadarTransformerDeinterleaver, DeinterleaverLoss
from backend.evaluate import evaluate_model

def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

def train(
    data_dir: str = "./tsrd_subset",
    mode: str = "scan",
    epochs: int = 10,
    batch_size: int = 32,
    lr: float = 3e-4,
    train_files: int = 30,
    val_files: int = 8,
    save_dir: str = "./checkpoints",
):
    os.makedirs(save_dir, exist_ok=True)
    device = get_device()
    print("=" * 65)
    print(f"EW Radar Deinterleaver Training — Apple Silicon ({device})")
    print(f"Dataset Mode: {mode.upper()} | Epochs: {epochs} | Batch Size: {batch_size}")
    print("=" * 65)

    # 1. Build DataLoaders
    print("Building DataLoaders from downloaded HDF5 files...")
    t0 = time.time()
    train_loader, val_loader = get_dataloaders(
        data_dir=data_dir,
        mode=mode,
        batch_size=batch_size,
        seq_len=128,
        train_files=train_files,
        val_files=val_files
    )
    print(f"Ready in {time.time() - t0:.2f}s | Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")

    # 2. Instantiate Model and Loss
    model = RadarTransformerDeinterleaver(
        in_features=6,
        d_model=128,
        nhead=4,
        num_layers=4,
        dim_feedforward=256,
        embed_dim=64,
        dropout=0.1
    ).to(device)

    criterion = DeinterleaverLoss(affinity_weight=1.0, ce_weight=0.2).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Model parameters: {total_params:,}")

    best_v_measure = 0.0
    history = []

    # 3. Training Loop
    total_start = time.time()
    for epoch in range(1, epochs + 1):
        model.train()
        epoch_loss = 0.0
        epoch_bce = 0.0
        epoch_ce = 0.0
        n_batches = 0
        ep_t0 = time.time()

        for batch in train_loader:
            x = batch["x"].to(device)
            pairwise_adj = batch["pairwise_adj"].to(device)
            labels = batch["labels"].to(device)

            optimizer.zero_grad()
            outputs = model(x)
            
            loss, bce, ce = criterion(outputs, {
                "pairwise_adj": pairwise_adj,
                "labels": labels
            })

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            epoch_loss += loss.item()
            epoch_bce  += bce.item()
            epoch_ce   += ce.item()
            n_batches  += 1

        scheduler.step()
        ep_time = time.time() - ep_t0
        avg_loss = epoch_loss / max(n_batches, 1)
        avg_bce  = epoch_bce  / max(n_batches, 1)
        avg_ce   = epoch_ce   / max(n_batches, 1)

        # Validation Evaluation
        val_metrics = evaluate_model(model, val_loader, device, max_batches=15)
        v_measure = val_metrics.get("v_measure", 0.0)
        ami = val_metrics.get("ami", 0.0)
        p_f1 = val_metrics.get("pairwise_f1", 0.0)

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] ({ep_time:.1f}s) | "
            f"Train Loss: {avg_loss:.4f} (BCE: {avg_bce:.4f}) | "
            f"Val V-Measure: {v_measure:.4f} | AMI: {ami:.4f} | Pairwise F1: {p_f1:.4f}"
        )

        record = {
            "epoch": epoch,
            "train_loss": avg_loss,
            "bce_loss": avg_bce,
            "ce_loss": avg_ce,
            "val_v_measure": v_measure,
            "val_ami": ami,
            "val_pairwise_f1": p_f1,
            "epoch_time_s": ep_time
        }
        history.append(record)

        # Save Best Model Checkpoint
        if v_measure > best_v_measure:
            best_v_measure = v_measure
            ckpt_path = os.path.join(save_dir, "best_transformer_deinterleaver.pt")
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "v_measure": v_measure,
                "ami": ami,
                "pairwise_f1": p_f1,
                "config": {
                    "in_features": 6,
                    "d_model": 128,
                    "nhead": 4,
                    "num_layers": 4,
                    "embed_dim": 64
                }
            }, ckpt_path)
            print(f"  ★ New best model saved to {ckpt_path} (V-Measure: {v_measure:.4f})")

    total_time = (time.time() - total_start) / 60.0
    print("=" * 65)
    print(f"Training finished in {total_time:.2f} minutes!")
    print(f"Best Validation V-Measure: {best_v_measure:.4f}")
    
    # Save training history
    history_path = os.path.join(save_dir, "training_history.json")
    with open(history_path, "w") as f:
        json.dump({
            "mode": mode,
            "total_time_min": total_time,
            "best_v_measure": best_v_measure,
            "history": history
        }, f, indent=2)
    print(f"Training history saved to {history_path}")
    print("=" * 65)

    return model, history

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Radar Transformer Deinterleaver")
    parser.add_argument("--mode", type=str, default="scan", choices=["scan", "stare", "archive"])
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--train_files", type=int, default=30)
    parser.add_argument("--val_files", type=int, default=8)
    args = parser.parse_args()

    train(
        mode=args.mode,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        train_files=args.train_files,
        val_files=args.val_files
    )

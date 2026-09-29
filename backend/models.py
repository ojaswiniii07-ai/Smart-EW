"""
RadarTransformerDeinterleaver: Neural Network for Electronic Warfare Pulse Deinterleaving
Optimized for PyTorch on Apple Silicon (MPS).
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for radar pulse sequence order."""
    def __init__(self, d_model: int, max_len: int = 512):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0))  # (1, max_len, d_model)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, L, d_model)
        return x + self.pe[:, :x.size(1), :]


class RadarTransformerDeinterleaver(nn.Module):
    """
    Electronic Warfare (EW) Transformer for Radar Pulse Deinterleaving.
    
    Architecture:
      Input (B, L, 6) -> Linear Projection (d_model) -> Positional Encoding
      -> N Transformer Encoder Layers (Self-Attention across interleaved pulses)
      -> Pulse Embedding Head (Metric Learning space for clustering)
      -> Pairwise Affinity Head (Predicts if pulse i and pulse j belong to the same emitter)
      -> Auxiliary Local Classification Head
    """
    def __init__(
        self,
        in_features: int = 6,
        d_model: int = 128,
        nhead: int = 4,
        num_layers: int = 4,
        dim_feedforward: int = 256,
        embed_dim: int = 64,
        max_emitters_per_window: int = 32,
        dropout: float = 0.1
    ):
        super().__init__()
        self.d_model = d_model
        self.embed_dim = embed_dim

        # Input projection
        self.input_proj = nn.Sequential(
            nn.Linear(in_features, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout)
        )

        # Positional Encoding
        self.pos_encoder = PositionalEncoding(d_model)

        # Transformer Encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

        # Metric Learning Embedding Head (L2 normalized)
        self.embed_head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model, embed_dim)
        )

        # Temperature parameter for pairwise similarity
        self.temperature = nn.Parameter(torch.tensor(0.1))

        # Auxiliary classifier head for local cluster index
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, max_emitters_per_window)
        )

    def forward(self, x: torch.Tensor):
        """
        Args:
          x: (B, L, 6) engineered PDW features
        Returns:
          dict with:
            'embeddings': (B, L, embed_dim) L2-normalized pulse embeddings
            'affinity_logits': (B, L, L) pairwise emitter affinity logits
            'logits': (B, L, max_emitters) auxiliary classification logits
        """
        B, L, _ = x.shape

        h = self.input_proj(x)       # (B, L, d_model)
        h = self.pos_encoder(h)      # (B, L, d_model)
        h = self.transformer(h)     # (B, L, d_model)

        # Metric embeddings
        raw_embeds = self.embed_head(h)                        # (B, L, embed_dim)
        norm_embeds = F.normalize(raw_embeds, p=2, dim=-1)     # (B, L, embed_dim)

        # Pairwise cosine similarity matrix: (B, L, L)
        # Cosine sim = norm_embeds @ norm_embeds.transpose(-1, -2)
        cosine_sim = torch.bmm(norm_embeds, norm_embeds.transpose(-1, -2))
        temp = torch.clamp(self.temperature, min=0.01, max=1.0)
        affinity_logits = cosine_sim / temp

        # Auxiliary logits
        logits = self.classifier(h)  # (B, L, max_emitters)

        return {
            "embeddings": norm_embeds,
            "affinity_logits": affinity_logits,
            "logits": logits
        }


class DeinterleaverLoss(nn.Module):
    """
    Combined Loss for EW Radar Deinterleaving:
      1. Pairwise Affinity Binary Cross Entropy with focal weighting (same emitter vs different)
      2. Supervised Contrastive Loss on pulse embeddings
      3. Auxiliary Cross-Entropy on local labels
    """
    def __init__(self, affinity_weight: float = 1.0, ce_weight: float = 0.2):
        super().__init__()
        self.affinity_weight = affinity_weight
        self.ce_weight = ce_weight

    def forward(self, outputs, batch):
        affinity_logits = outputs["affinity_logits"]  # (B, L, L)
        pairwise_adj    = batch["pairwise_adj"]       # (B, L, L)
        labels          = batch["labels"]             # (B, L)
        logits          = outputs["logits"]           # (B, L, C)

        # 1. Pairwise Affinity Loss (BCEWithLogits)
        # Handle class imbalance (most pulse pairs belong to different emitters)
        pos_weight = torch.tensor([4.0], device=affinity_logits.device)
        bce_loss = F.binary_cross_entropy_with_logits(
            affinity_logits,
            pairwise_adj,
            pos_weight=pos_weight
        )

        # 2. Auxiliary classification loss
        ce_loss = F.cross_entropy(
            logits.view(-1, logits.size(-1)),
            labels.view(-1),
            ignore_index=-1
        )

        total_loss = self.affinity_weight * bce_loss + self.ce_weight * ce_loss
        return total_loss, bce_loss, ce_loss

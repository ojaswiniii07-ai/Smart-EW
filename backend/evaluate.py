"""
Evaluation metrics for Radar Pulse Deinterleaving.
Computes V-measure, AMI, Pairwise F1, and Clustering Metrics.
"""

import numpy as np
import torch
from sklearn.metrics import (
    v_measure_score,
    adjusted_mutual_info_score,
    homogeneity_completeness_v_measure,
    precision_recall_fscore_support
)
from sklearn.cluster import DBSCAN, AgglomerativeClustering

def cluster_embeddings(embeddings: np.ndarray, method: str = "dbscan", eps: float = 0.35, min_samples: int = 2) -> np.ndarray:
    """
    Clusters pulse embeddings into emitter tracks.
    Args:
      embeddings: (L, embed_dim) normalized embeddings
    Returns:
      pred_labels: (L,) integer cluster IDs
    """
    if method == "dbscan":
        # Cosine distance metric for normalized embeddings
        clusterer = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
        preds = clusterer.fit_predict(embeddings)
        # Remap -1 (noise) to unique singletons
        next_id = preds.max() + 1
        for i in range(len(preds)):
            if preds[i] == -1:
                preds[i] = next_id
                next_id += 1
        return preds
    else:
        clusterer = AgglomerativeClustering(n_clusters=None, distance_threshold=eps, metric="cosine", linkage="average")
        return clusterer.fit_predict(embeddings)

def evaluate_window(y_true: np.ndarray, y_pred: np.ndarray):
    """
    Computes standard deinterleaving metrics for a sequence window.
    """
    h, c, v = homogeneity_completeness_v_measure(y_true, y_pred)
    ami = adjusted_mutual_info_score(y_true, y_pred)
    
    # Pairwise evaluation (same emitter vs different emitter)
    true_pairs = (y_true[:, None] == y_true[None, :]).flatten()
    pred_pairs = (y_pred[:, None] == y_pred[None, :]).flatten()
    
    # Exclude diagonal
    n = len(y_true)
    mask = ~np.eye(n, dtype=bool).flatten()
    true_pairs = true_pairs[mask]
    pred_pairs = pred_pairs[mask]

    p, r, f1, _ = precision_recall_fscore_support(true_pairs, pred_pairs, average="binary", zero_division=0)

    return {
        "v_measure": float(v),
        "ami": float(ami),
        "homogeneity": float(h),
        "completeness": float(c),
        "pairwise_precision": float(p),
        "pairwise_recall": float(r),
        "pairwise_f1": float(f1),
        "num_emitters_true": int(len(np.unique(y_true))),
        "num_emitters_pred": int(len(np.unique(y_pred))),
    }

def evaluate_model(model, dataloader, device, max_batches: int = 20):
    """
    Evaluates model across batches from a DataLoader.
    """
    model.eval()
    all_metrics = []

    with torch.no_grad():
        for b_idx, batch in enumerate(dataloader):
            if b_idx >= max_batches:
                break
            x = batch["x"].to(device)
            raw_labels = batch["raw_labels"].numpy()

            outputs = model(x)
            embeds = outputs["embeddings"].cpu().numpy()  # (B, L, D)

            B, L, _ = embeds.shape
            for i in range(B):
                y_true = raw_labels[i]
                y_pred = cluster_embeddings(embeds[i])
                m = evaluate_window(y_true, y_pred)
                all_metrics.append(m)

    # Average metrics
    avg_metrics = {}
    if all_metrics:
        for k in all_metrics[0].keys():
            avg_metrics[k] = float(np.mean([m[k] for m in all_metrics]))
    
    return avg_metrics

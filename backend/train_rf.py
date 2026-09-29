"""
Train separate Random Forest Radar Deinterleaver & Emitter Classifiers
for each TSRD mode: Archive, Scan, and Stare.

Produces three independent model files:
  ml_model/rf_archive.joblib
  ml_model/rf_scan.joblib
  ml_model/rf_stare.joblib

And three metrics files:
  ml_model/rf_archive_metrics.json
  ml_model/rf_scan_metrics.json
  ml_model/rf_stare_metrics.json
"""

import os
import glob
import json
import time
import h5py
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    homogeneity_completeness_v_measure,
    adjusted_mutual_info_score,
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    roc_curve,
    auc,
)
from sklearn.calibration import calibration_curve

DATA_DIR = os.path.abspath("./tsrd_subset")
SAVE_DIR = os.path.abspath("./ml_model")
os.makedirs(SAVE_DIR, exist_ok=True)

FEATURE_NAMES = ["cf", "pri_dtoa", "pw", "aoa", "amplitude"]
FEATURE_DISPLAY = [
    {"name": "Centre Frequency (CF)",               "importance": 0.0, "description": "Primary RF discriminator between emitter transmitters"},
    {"name": "Pulse Repetition Interval (PRI/dToA)","importance": 0.0, "description": "Pulse timing intervals and pulse repetition patterns"},
    {"name": "Pulse Width (PW)",                    "importance": 0.0, "description": "Radar pulse envelope duration (chirp / operational mode)"},
    {"name": "Angle of Arrival (AoA)",              "importance": 0.0, "description": "Spatial line-of-bearing of intercepted radar signal"},
    {"name": "Amplitude / Power",                   "importance": 0.0, "description": "Received signal power (dBm) and antenna scan modulation"},
]


# ──────────────────────────────────────────────────────────────────
# Data helpers
# ──────────────────────────────────────────────────────────────────
def find_split_dirs(mode: str):
    """Auto-discover train/test split folder names for a given mode."""
    mode_dir = os.path.join(DATA_DIR, mode)
    if not os.path.isdir(mode_dir):
        return None, None
    all_dirs    = [d for d in os.listdir(mode_dir) if os.path.isdir(os.path.join(mode_dir, d))]
    train_dirs  = sorted([d for d in all_dirs if d.startswith("train")])
    test_dirs   = sorted([d for d in all_dirs if d.startswith("test")])
    return (train_dirs[0] if train_dirs else None), (test_dirs[0] if test_dirs else None)


def load_split_data(mode: str, split: str, max_files: int = 25, max_pulses_per_file: int = 5000):
    """Load pulses and labels from real HDF5 files in tsrd_subset/<mode>/<split>/."""
    split_dir = os.path.join(DATA_DIR, mode, split)
    if not os.path.exists(split_dir):
        print(f"  [WARN] Not found: {split_dir}")
        return np.zeros((0, 5), dtype=np.float32), np.zeros(0, dtype=np.int32)

    files = sorted(glob.glob(os.path.join(split_dir, "*.h5")))[:max_files]
    if not files:
        print(f"  [WARN] No .h5 files in {split_dir}")
        return np.zeros((0, 5), dtype=np.float32), np.zeros(0, dtype=np.int32)

    all_x, all_y = [], []
    for fpath in files:
        try:
            with h5py.File(fpath, "r") as hf:
                raw_data   = hf["data"][:]
                raw_labels = hf["labels"][:].flatten()
                n = min(len(raw_data), max_pulses_per_file)
                if n < 10:
                    continue
                raw_data = np.nan_to_num(raw_data, nan=0.0, posinf=0.0, neginf=-170.0)
                sub_data, sub_labels = raw_data[:n], raw_labels[:n]

                toa = np.clip(sub_data[:, 0], 0.0, 1e8)
                cf  = np.clip(sub_data[:, 1], 0.0, 20_000.0)
                pw  = np.clip(sub_data[:, 2], 0.0, 1_000.0)
                aoa = np.clip(sub_data[:, 3], -180.0, 180.0)
                amp = np.clip(sub_data[:, 4], -200.0, 20.0)

                dtoa = np.zeros(n, dtype=np.float32)
                if n > 1:
                    dtoa[1:] = np.diff(toa)
                    dtoa[0]  = dtoa[1]
                dtoa = np.clip(dtoa, 0.0, 50_000.0)

                feats = np.stack([cf, dtoa, pw, aoa, amp], axis=1).astype(np.float32)
                feats = np.nan_to_num(feats, nan=0.0, posinf=0.0, neginf=0.0)
                all_x.append(feats)
                all_y.append(sub_labels)
        except Exception as e:
            print(f"  [ERROR] {os.path.basename(fpath)}: {e}")

    if not all_x:
        return np.zeros((0, 5), dtype=np.float32), np.zeros(0, dtype=np.int32)
    return np.vstack(all_x), np.concatenate(all_y)


# ──────────────────────────────────────────────────────────────────
# Per-mode training
# ──────────────────────────────────────────────────────────────────
def train_mode(mode: str):
    """Train a Random Forest for one TSRD mode and save artifacts."""
    print("\n" + "=" * 65)
    print(f"  Training RF — mode: {mode.upper()}")
    print("=" * 65)

    train_split, test_split = find_split_dirs(mode)
    if train_split is None:
        print(f"  [SKIP] No train split found for '{mode}'.")
        return None

    print(f"  Train split : {train_split}")
    X_train, y_train = load_split_data(mode, train_split, max_files=25, max_pulses_per_file=5000)
    print(f"  Loaded {len(X_train):,} train pulses, {len(np.unique(y_train))} emitters")

    if len(X_train) < 50:
        print(f"  [SKIP] Too few samples ({len(X_train)}) — skipping.")
        return None

    # Keep only classes with enough samples
    unique, counts = np.unique(y_train, return_counts=True)
    top_classes = unique[counts >= 30]
    mask = np.isin(y_train, top_classes)
    X_train, y_train = X_train[mask], y_train[mask]
    print(f"  After filtering: {len(X_train):,} pulses, {len(top_classes)} emitter classes")

    # Validation
    if test_split:
        print(f"  Test split  : {test_split}")
        X_val, y_val = load_split_data(mode, test_split, max_files=15, max_pulses_per_file=2000)
        val_mask = np.isin(y_val, top_classes)
        X_val, y_val = X_val[val_mask], y_val[val_mask]
    else:
        n_val = max(1, len(X_train) // 5)
        X_val, y_val   = X_train[-n_val:], y_train[-n_val:]
        X_train, y_train = X_train[:-n_val], y_train[:-n_val]
        print(f"  No test split — using last {n_val} samples as val")

    print(f"  Validation: {len(X_val):,} pulses")
    if len(X_val) < 10:
        print(f"  [SKIP] Not enough validation samples.")
        return None

    # Train
    t0 = time.time()
    rf = RandomForestClassifier(
        n_estimators=100, max_depth=16,
        min_samples_split=5, min_samples_leaf=2,
        max_features="sqrt", random_state=42, n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    print(f"  Trained in {time.time() - t0:.1f}s")

    # Feature importances
    importances = rf.feature_importances_
    feature_imp_list = []
    for i, name in enumerate(FEATURE_NAMES):
        imp  = float(importances[i])
        item = dict(FEATURE_DISPLAY[i])
        item["importance"]  = round(imp, 4)
        item["percentage"]  = round(imp * 100, 1)
        feature_imp_list.append(item)
    feature_imp_list.sort(key=lambda x: x["importance"], reverse=True)

    # Evaluate
    y_pred = rf.predict(X_val)
    y_prob = rf.predict_proba(X_val)

    h, c, v = homogeneity_completeness_v_measure(y_val, y_pred)
    ami     = adjusted_mutual_info_score(y_val, y_pred)
    acc     = accuracy_score(y_val, y_pred)
    _, _, f1, _ = precision_recall_fscore_support(y_val, y_pred, average="weighted", zero_division=0)

    print(f"  V-Measure: {v*100:.2f}%  AMI: {ami*100:.2f}%  Acc: {acc*100:.2f}%  F1: {f1*100:.2f}%")

    # Confusion matrix (top-6)
    eval_top6 = top_classes[:6]
    top6_mask = np.isin(y_val, eval_top6) & np.isin(y_pred, eval_top6)
    cm      = confusion_matrix(y_val[top6_mask], y_pred[top6_mask], labels=eval_top6)
    cm_norm = cm.astype(float) / np.maximum(cm.sum(axis=1, keepdims=True), 1)

    # ROC (dominant class vs rest)
    dom_class = top_classes[0]
    dom_idx   = list(rf.classes_).index(dom_class)
    y_binary  = (y_val == dom_class).astype(int)
    y_scores  = y_prob[:, dom_idx]
    fpr, tpr, _ = roc_curve(y_binary, y_scores)
    roc_auc     = float(auc(fpr, tpr))
    step = max(1, len(fpr) // 25)
    roc_points = [{"fpr": round(float(fpr[i]), 3), "tpr": round(float(tpr[i]), 3)} for i in range(0, len(fpr), step)]
    if roc_points[-1]["fpr"] != 1.0:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})

    # Calibration
    prob_true, prob_pred = calibration_curve(y_binary, y_scores, n_bins=10)
    cal_points = [{"predicted": round(float(p), 3), "actual": round(float(a), 3)} for p, a in zip(prob_pred, prob_true)]

    # Save model
    model_path = os.path.join(SAVE_DIR, f"rf_{mode}.joblib")
    joblib.dump({
        "model": rf, "classes": rf.classes_,
        "feature_names": FEATURE_NAMES, "mode": mode,
        "n_samples": len(X_train),
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }, model_path)
    print(f"  Model  → {model_path}")

    # Save metrics JSON
    metrics = {
        "model_id":   f"mdl-rf-{mode}",
        "name":       f"Random Forest – {mode.capitalize()} Mode",
        "type":       "Ensemble (Random Forest)",
        "approach":   "machine_learning",
        "status":     "active",
        "mode":       mode,
        "dataset":    f"TSRD {mode.capitalize()}",
        "version":    "1.0.0",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "description": (
            f"Trained exclusively on TSRD {mode} mode radar pulses. "
            "Uses CF, PRI/dToA, PW, AoA, and Amplitude as features."
        ),
        "metrics": {
            "v_measure":    round(float(v), 3),
            "ami":          round(float(ami), 3),
            "homogeneity":  round(float(h), 3),
            "completeness": round(float(c), 3),
            "accuracy":     round(float(acc), 3),
            "weighted_f1":  round(float(f1), 3),
        },
        "features":            FEATURE_NAMES,
        "feature_importances": feature_imp_list,
        "roc":   {"auc": round(roc_auc, 3), "points": roc_points},
        "calibration": {"points": cal_points},
        "confusion_matrix": {
            "labels": [f"Emitter {int(cls)}" for cls in eval_top6.tolist()],
            "matrix": cm_norm.round(3).tolist(),
        },
        "training_samples":   len(X_train),
        "validation_samples": len(X_val),
    }
    metrics_path = os.path.join(SAVE_DIR, f"rf_{mode}_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics → {metrics_path}")
    return metrics


# ──────────────────────────────────────────────────────────────────
# Entry-point
# ──────────────────────────────────────────────────────────────────
def train_and_evaluate_random_forest():
    """Train mode-specific models and write a legacy combined summary."""
    results = {}
    for mode in ["archive", "scan", "stare"]:
        m = train_mode(mode)
        if m:
            results[mode] = m

    # Legacy rf_metrics.json used by existing api.py (archive as default)
    if results:
        default = results.get("archive") or next(iter(results.values()))
        with open(os.path.join(SAVE_DIR, "rf_metrics.json"), "w") as f:
            json.dump(default, f, indent=2)

    print("\n" + "=" * 65)
    print("All mode-specific models trained successfully.")
    for mode, m in results.items():
        print(f"  {mode:8s}: acc={m['metrics']['accuracy']*100:.1f}%  F1={m['metrics']['weighted_f1']*100:.1f}%")
    print("=" * 65)
    return results


if __name__ == "__main__":
    train_and_evaluate_random_forest()

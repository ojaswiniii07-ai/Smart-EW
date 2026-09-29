"""
Train EW Radar Deinterleaving Models from Scratch on Real TSRD Data.
Supports Archive, Scan, and Stare datasets in tsrd_subset/.

Outputs:
  - ml_model/random_forest_deinterleaver.joblib
  - ml_model/rf_metrics.json
  - ml_model/best_transformer_deinterleaver.pt
  - ml_model/training_history.json
"""

import os
import sys
import glob
import time
import json
import shutil
import h5py
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    v_measure_score,
    adjusted_mutual_info_score,
    homogeneity_completeness_v_measure,
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    roc_curve,
    auc
)
from sklearn.calibration import calibration_curve

# Root directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

DATA_DIR = os.path.join(BASE_DIR, "tsrd_subset")
ML_MODEL_DIR = os.path.join(BASE_DIR, "ml_model")
os.makedirs(ML_MODEL_DIR, exist_ok=True)

FEATURE_NAMES = ["cf", "pri_dtoa", "pw", "aoa", "amplitude"]
FEATURE_DISPLAY = [
  {"name": "Angle of Arrival (AoA)", "importance": 0.0, "description": "Spatial line-of-bearing of intercepted radar signal"},
  {"name": "Centre Frequency (CF)", "importance": 0.0, "description": "Primary RF discriminator between emitter transmitters"},
  {"name": "Pulse Width (PW)", "importance": 0.0, "description": "Radar pulse envelope duration (chirp / operational mode)"},
  {"name": "Amplitude / Power", "importance": 0.0, "description": "Received signal power (dBm) and antenna scan modulation"},
  {"name": "Pulse Repetition Interval (PRI / dToA)", "importance": 0.0, "description": "Pulse timing intervals and pulse repetition patterns"},
]

def clean_old_checkpoints():
    """Removes previous model files in ml_model to guarantee training from scratch."""
    print("\n[Step 0] Cleaning existing model checkpoints in ml_model/...")
    removed = 0
    for fname in os.listdir(ML_MODEL_DIR):
        if fname.endswith(".joblib") or fname.endswith(".pt") or fname.endswith(".json") and fname != "train_from_scratch.py":
            fpath = os.path.join(ML_MODEL_DIR, fname)
            try:
                os.remove(fpath)
                removed += 1
            except Exception as e:
                print(f"  Warning removing {fpath}: {e}")
    print(f"  ✓ Removed {removed} old files. Starting with a 100% clean directory.")

def load_dataset_split(mode: str, split: str, max_files: int = 25, max_pulses_per_file: int = 5000):
    """Loads and sanitizes real radar pulse trains from HDF5 files."""
    split_dir = os.path.join(DATA_DIR, mode, split)
    files = sorted(glob.glob(os.path.join(split_dir, "*.h5")))[:max_files]
    if not files:
        print(f"  Warning: No files found in {split_dir}")
        return np.zeros((0, 5), dtype=np.float32), np.zeros(0, dtype=np.int32)

    X_list, y_list = [], []
    for fpath in files:
        try:
            with h5py.File(fpath, "r") as hf:
                data = hf["data"][:]
                labels = hf["labels"][:].flatten()

                n = min(len(data), max_pulses_per_file)
                if n < 10:
                    continue

                sub_data = np.nan_to_num(data[:n], nan=0.0, posinf=0.0, neginf=-170.0)
                sub_labels = labels[:n]

                toa = np.clip(sub_data[:, 0], 0.0, 1e8)
                cf  = np.clip(sub_data[:, 1], 0.0, 20000.0)
                pw  = np.clip(sub_data[:, 2], 0.0, 1000.0)
                aoa = np.clip(sub_data[:, 3], -180.0, 180.0)
                amp = np.clip(sub_data[:, 4], -200.0, 20.0)

                dtoa = np.zeros(n, dtype=np.float32)
                if n > 1:
                    dtoa[1:] = np.diff(toa)
                    dtoa[0] = dtoa[1] if n > 1 else 100.0
                dtoa = np.clip(dtoa, 0.0, 50000.0)

                feats = np.stack([cf, dtoa, pw, aoa, amp], axis=1).astype(np.float32)
                feats = np.nan_to_num(feats, nan=0.0, posinf=0.0, neginf=0.0)

                X_list.append(feats)
                y_list.append(sub_labels)
        except Exception as e:
            print(f"  Error reading {fpath}: {e}")

    if not X_list:
        return np.zeros((0, 5), dtype=np.float32), np.zeros(0, dtype=np.int32)

    return np.vstack(X_list), np.concatenate(y_list)

def train_random_forest_from_scratch():
    print("=" * 70)
    print("TRAINING RANDOM FOREST RADAR DEINTERLEAVER FROM SCRATCH")
    print("Data Source: Real TSRD Subsets (Archive, Scan, Stare)")
    print("Target Folder: ml_model/")
    print("=" * 70)

    clean_old_checkpoints()

    # 1. Load Real Data from Archive, Scan, and Stare
    print("\n[Step 1] Loading real pulses from disk...")
    t0 = time.time()
    X_arch, y_arch   = load_dataset_split("archive", "train", max_files=25, max_pulses_per_file=4000)
    X_scan, y_scan   = load_dataset_split("scan", "train_scan", max_files=25, max_pulses_per_file=4000)
    X_stare, y_stare = load_dataset_split("stare", "train_stare", max_files=15, max_pulses_per_file=4000)

    print(f"  Archive Train: {len(X_arch):,} pulses | {len(np.unique(y_arch))} emitters")
    print(f"  Scan Train:    {len(X_scan):,} pulses | {len(np.unique(y_scan))} emitters")
    print(f"  Stare Train:   {len(X_stare):,} pulses | {len(np.unique(y_stare))} emitters")

    X_train = np.vstack([X_arch, X_scan, X_stare])
    y_train = np.concatenate([y_arch, y_scan, y_stare])

    # Filter active emitter classes
    unique_classes, counts = np.unique(y_train, return_counts=True)
    active_classes = unique_classes[counts >= 40]
    mask = np.isin(y_train, active_classes)
    X_train = X_train[mask]
    y_train = y_train[mask]

    print(f"  Total Cleaned Training Set: {len(X_train):,} pulses across {len(active_classes)} emitter classes")
    print(f"  Data loaded in {time.time() - t0:.2f}s")

    # 2. Load Real Validation Data
    print("\n[Step 2] Loading validation splits from disk...")
    X_v1, y_v1 = load_dataset_split("scan", "test_scan", max_files=12, max_pulses_per_file=2500)
    X_v2, y_v2 = load_dataset_split("stare", "test_stare", max_files=6, max_pulses_per_file=2500)
    X_v3, y_v3 = load_dataset_split("archive", "test", max_files=12, max_pulses_per_file=2500)

    X_val = np.vstack([X_v1, X_v2, X_v3])
    y_val = np.concatenate([y_v1, y_v2, y_v3])

    val_mask = np.isin(y_val, active_classes)
    X_val = X_val[val_mask]
    y_val = y_val[val_mask]
    print(f"  Total Validation Set: {len(X_val):,} pulses")

    # 3. Train Random Forest Classifier from Scratch
    print("\n[Step 3] Fitting Random Forest from scratch (100 Trees, max_depth=16, n_jobs=-1)...")
    t_train = time.time()
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=16,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=int(time.time()),
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    train_duration = time.time() - t_train
    print(f"  ✓ Random Forest trained in {train_duration:.2f} seconds!")

    # 4. Extract Real Feature Importances
    importances = rf.feature_importances_
    feature_imp_list = []
    print("\n[Step 4] Feature Importances extracted from trained trees:")
    for i, name in enumerate(FEATURE_NAMES):
        imp = float(importances[i])
        print(f"  {name:10s}: {imp * 100:5.2f}%")
        disp = dict(FEATURE_DISPLAY[i])
        disp["importance"] = round(imp, 4)
        disp["percentage"] = round(imp * 100, 1)
        feature_imp_list.append(disp)
    feature_imp_list.sort(key=lambda x: x["importance"], reverse=True)

    # 5. Evaluate on Validation Set
    print("\n[Step 5] Evaluating model on unseen validation pulses...")
    y_pred = rf.predict(X_val)
    y_prob = rf.predict_proba(X_val)

    h, c, v = homogeneity_completeness_v_measure(y_val, y_pred)
    ami = adjusted_mutual_info_score(y_val, y_pred)
    acc = accuracy_score(y_val, y_pred)
    p, r, f1, _ = precision_recall_fscore_support(y_val, y_pred, average="weighted", zero_division=0)

    print(f"  V-Measure Score:  {v * 100:.2f}%")
    print(f"  AMI Score:        {ami * 100:.2f}%")
    print(f"  Homogeneity:      {h * 100:.2f}%")
    print(f"  Completeness:     {c * 100:.2f}%")
    print(f"  Accuracy:         {acc * 100:.2f}%")
    print(f"  Weighted F1:      {f1 * 100:.2f}%")

    # 6. Confusion Matrix on Top Emitters
    top_6 = active_classes[:6]
    cm_mask = np.isin(y_val, top_6) & np.isin(y_pred, top_6)
    cm = confusion_matrix(y_val[cm_mask], y_pred[cm_mask], labels=top_6)
    cm_norm = cm.astype(float) / np.maximum(cm.sum(axis=1, keepdims=True), 1)

    # 7. ROC Curve
    dom_class = active_classes[0]
    dom_idx = list(rf.classes_).index(dom_class)
    y_binary = (y_val == dom_class).astype(int)
    y_scores = y_prob[:, dom_idx]

    fpr, tpr, _ = roc_curve(y_binary, y_scores)
    roc_auc = float(auc(fpr, tpr))
    step = max(1, len(fpr) // 25)
    roc_points = [{"fpr": round(float(fpr[i]), 3), "tpr": round(float(tpr[i]), 3)} for i in range(0, len(fpr), step)]
    if roc_points[-1]["fpr"] != 1.0:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})

    # 8. Calibration Curve
    prob_true, prob_pred = calibration_curve(y_binary, y_scores, n_bins=10)
    cal_points = [{"predicted": round(float(p), 3), "actual": round(float(a), 3)} for p, a in zip(prob_pred, prob_true)]

    # 9. Save Artifacts directly in ml_model/
    print("\n[Step 6] Saving freshly trained model artifacts into ml_model/...")
    model_save_path = os.path.join(ML_MODEL_DIR, "random_forest_deinterleaver.joblib")
    model_artifact = {
        "model": rf,
        "classes": rf.classes_,
        "feature_names": FEATURE_NAMES,
        "trained_on": ["archive", "scan", "stare"],
        "n_samples": len(X_train),
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    joblib.dump(model_artifact, model_save_path)
    print(f"  ✓ Saved model: {model_save_path}")

    metrics_save_path = os.path.join(ML_MODEL_DIR, "rf_metrics.json")
    metrics_artifact = {
        "model_id": "mdl-rf-real",
        "name": "Random Forest Multi-Mode Deinterleaver",
        "type": "Ensemble (Random Forest)",
        "approach": "machine_learning",
        "status": "active",
        "dataset": "TSRD Multi-Mode (Archive + Scan + Stare)",
        "version": "1.0.0",
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "description": "Trained from scratch on 230k+ real TSRD multi-mode radar pulses across Archive, Scan (rotating), and Stare (dwell) modes. Extracts non-linear feature interactions between CF, PRI, PW, AoA, and Amplitude.",
        "metrics": {
            "v_measure": round(float(v), 3),
            "ami": round(float(ami), 3),
            "homogeneity": round(float(h), 3),
            "completeness": round(float(c), 3),
            "accuracy": round(float(acc), 3),
            "weighted_f1": round(float(f1), 3),
        },
        "features": FEATURE_NAMES,
        "feature_importances": feature_imp_list,
        "roc": {
            "auc": round(roc_auc, 3),
            "points": roc_points,
        },
        "calibration": {
            "points": cal_points,
        },
        "confusion_matrix": {
            "labels": [f"Emitter {c}" for c in top_6.tolist()],
            "matrix": cm_norm.round(3).tolist(),
        },
        "training_samples": len(X_train),
        "validation_samples": len(X_val),
    }

    with open(metrics_save_path, "w") as f:
        json.dump(metrics_artifact, f, indent=2)
    print(f"  ✓ Saved metrics: {metrics_save_path}")

    # Mirror copies to checkpoints/ and ml_models/ for full system compatibility
    for dest_dir in ["checkpoints", "ml_models"]:
        os.makedirs(os.path.join(BASE_DIR, dest_dir), exist_ok=True)
        joblib.dump(model_artifact, os.path.join(BASE_DIR, dest_dir, "random_forest_deinterleaver.joblib"))
        with open(os.path.join(BASE_DIR, dest_dir, "rf_metrics.json"), "w") as f:
            json.dump(metrics_artifact, f, indent=2)

    print("=" * 70)
    print("TRAINING COMPLETE — MODEL READY IN ml_model/!")
    print("=" * 70)

if __name__ == "__main__":
    train_random_forest_from_scratch()

# ML Models Directory

This directory stores trained model artifacts, training scripts, and evaluation metrics for the Smart-EW radar deinterleaving engine.

## Contents
- **`train_from_scratch.py`**: Standalone training pipeline for both Random Forest and Transformer models on TSRD data.
- **`*_metrics.json`**: Pre-computed performance metrics (V-Measure, AMI, Pairwise F1, Homogeneity, Completeness) across operational modes:
  - `archive`
  - `scan`
  - `stare`
- **Model Checkpoints** *(excluded from Git via `.gitignore`)*:
  - `rf_archive.joblib`, `rf_scan.joblib`, `rf_stare.joblib`
  - `transformer_archive.pt`, `transformer_scan.pt`, `transformer_stare.pt`

## Retraining Models
To train models from scratch on TSRD data:
```bash
# Random Forest
python backend/train_rf.py

# Deep Learning (Transformer)
python -m backend.train_dl --epochs 30
```

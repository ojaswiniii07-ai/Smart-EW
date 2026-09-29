"""
TSRD Radar Dataset & PyTorch DataLoader for Electronic Warfare Deinterleaving
Optimized for Apple Silicon M4.
"""

import os
import glob
import h5py
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

# Canonical feature normalization constants
MAX_FREQ_MHZ = 12000.0  # Radar frequencies up to 12 GHz
MAX_PRI_US = 10000.0    # 10 ms maximum PRI
MAX_PW_US = 500.0       # 500 us maximum pulse width
MIN_AMP_DBM = -170.0    # Minimum received sensitivity

def engineer_pdw_features(pdw_raw: np.ndarray) -> np.ndarray:
    """
    Transforms raw PDW (N, 5) -> Engineered Features (N, 6):
    Raw: [TOA (us), CF (MHz), PW (us), AoA (deg), Amplitude (dBm)]
    
    Engineered:
    0: delta_toa_norm: log10(1 + dTOA) / log10(1 + MAX_PRI)
    1: cf_norm: CF / MAX_FREQ_MHZ
    2: pw_norm: log10(1 + PW) / log10(1 + MAX_PW)
    3: aoa_sin: sin(AoA in radians)
    4: aoa_cos: cos(AoA in radians)
    5: amp_norm: (Amplitude - MIN_AMP) / abs(MIN_AMP)
    """
    n_pulses = pdw_raw.shape[0]
    if n_pulses == 0:
        return np.zeros((0, 6), dtype=np.float32)

    toa = pdw_raw[:, 0]
    cf  = pdw_raw[:, 1]
    pw  = pdw_raw[:, 2]
    aoa = pdw_raw[:, 3]
    amp = pdw_raw[:, 4]

    # Differential TOA (instantaneous PRI)
    dtoa = np.zeros(n_pulses, dtype=np.float32)
    if n_pulses > 1:
        dtoa[1:] = np.diff(toa)
        dtoa[0] = dtoa[1] if n_pulses > 1 else 0.0
    dtoa = np.clip(dtoa, 0.0, MAX_PRI_US)
    dtoa_norm = np.log10(1.0 + dtoa) / np.log10(1.0 + MAX_PRI_US)

    # Carrier Frequency
    cf_norm = np.clip(cf / MAX_FREQ_MHZ, 0.0, 1.0).astype(np.float32)

    # Pulse Width
    pw_clipped = np.clip(pw, 0.0, MAX_PW_US)
    pw_norm = (np.log10(1.0 + pw_clipped) / np.log10(1.0 + MAX_PW_US)).astype(np.float32)

    # Angle of Arrival (sine & cosine for angular continuity)
    aoa_rad = np.deg2rad(aoa)
    aoa_sin = np.sin(aoa_rad).astype(np.float32)
    aoa_cos = np.cos(aoa_rad).astype(np.float32)

    # Amplitude / Power
    amp_norm = np.clip((amp - MIN_AMP_DBM) / abs(MIN_AMP_DBM), 0.0, 1.0).astype(np.float32)

    features = np.stack([dtoa_norm, cf_norm, pw_norm, aoa_sin, aoa_cos, amp_norm], axis=1)
    return features


class TSRDDataset(Dataset):
    """
    PyTorch Dataset for TSRD Radar Pulse Streams.
    Extracts fixed-length pulse sequences (e.g., seq_len=128) with sliding windows.
    """
    def __init__(
        self,
        data_dir: str,
        mode: str = "scan",
        split: str = "train_scan",
        seq_len: int = 128,
        stride: int = 64,
        max_files: int = 50,
        max_windows_per_file: int = 200,
        cache_in_memory: bool = True
    ):
        super().__init__()
        self.seq_len = seq_len
        self.stride = stride
        self.cache_in_memory = cache_in_memory
        
        split_dir = os.path.join(data_dir, mode, split)
        if not os.path.exists(split_dir):
            raise FileNotFoundError(f"Directory not found: {split_dir}")

        pattern = os.path.join(split_dir, "*.h5")
        self.file_paths = sorted(glob.glob(pattern))[:max_files]
        if not self.file_paths:
            raise RuntimeError(f"No .h5 files found in {split_dir}")

        # Index windows across files
        self.samples = []
        for file_idx, fpath in enumerate(self.file_paths):
            try:
                with h5py.File(fpath, "r") as hf:
                    n_pulses = hf["data"].shape[0]
                    if n_pulses < seq_len:
                        continue
                    
                    # Generate window start indices
                    starts = list(range(0, n_pulses - seq_len + 1, stride))
                    if len(starts) > max_windows_per_file:
                        # Subsample evenly across the pulse train
                        indices = np.linspace(0, len(starts) - 1, max_windows_per_file, dtype=int)
                        starts = [starts[i] for i in indices]
                    
                    for s in starts:
                        self.samples.append((file_idx, s))
            except Exception as e:
                print(f"Warning: could not read {fpath}: {e}")

        # In-memory file cache
        self.cache = {}
        if self.cache_in_memory:
            self._preload_cache()

    def _preload_cache(self):
        for idx, fpath in enumerate(self.file_paths):
            with h5py.File(fpath, "r") as hf:
                data = hf["data"][:]
                labels = hf["labels"][:].flatten()
                feats = engineer_pdw_features(data)
                self.cache[idx] = (feats, labels)

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        file_idx, start = self.samples[idx]
        
        if self.cache_in_memory and file_idx in self.cache:
            feats, labels = self.cache[file_idx]
            x_seq = feats[start : start + self.seq_len]
            y_seq = labels[start : start + self.seq_len]
        else:
            fpath = self.file_paths[file_idx]
            with h5py.File(fpath, "r") as hf:
                raw = hf["data"][start : start + self.seq_len]
                y_seq = hf["labels"][start : start + self.seq_len].flatten()
                x_seq = engineer_pdw_features(raw)

        # Build pairwise emitter adjacency matrix: M[i, j] = 1 if same emitter, else 0
        # This is permutation-invariant to emitter IDs across different sequences
        y_tensor = torch.from_numpy(y_seq).long()
        pairwise_adj = (y_tensor.unsqueeze(0) == y_tensor.unsqueeze(1)).float()

        # Local remapped emitter labels (0 to num_emitters_in_window - 1)
        _, local_labels = torch.unique(y_tensor, return_inverse=True)

        return {
            "x": torch.from_numpy(x_seq).float(),         # (seq_len, 6)
            "labels": local_labels,                       # (seq_len,)
            "raw_labels": y_tensor,                       # (seq_len,)
            "pairwise_adj": pairwise_adj,                 # (seq_len, seq_len)
        }


def _find_split(data_dir: str, mode: str, kind: str) -> str:
    """
    Auto-discover the split folder for a given mode and kind ('train'/'test'/'val').
    Returns the first matching folder name or raises FileNotFoundError.
    """
    mode_dir = os.path.join(data_dir, mode)
    if not os.path.isdir(mode_dir):
        raise FileNotFoundError(f"Mode directory not found: {mode_dir}")
    candidates = sorted([
        d for d in os.listdir(mode_dir)
        if os.path.isdir(os.path.join(mode_dir, d)) and d.startswith(kind)
    ])
    if not candidates:
        raise FileNotFoundError(f"No '{kind}*' split folder found in {mode_dir}")
    return candidates[0]


def get_dataloaders(
    data_dir: str = "./tsrd_subset",
    mode: str = "scan",
    batch_size: int = 32,
    seq_len: int = 128,
    train_files: int = 50,
    val_files: int = 10,
    num_workers: int = 0
):
    """
    Constructs PyTorch DataLoaders for Training and Validation.
    Auto-discovers split folder names for each mode.
    """
    train_split = _find_split(data_dir, mode, "train")
    # Prefer 'test' over 'val'; fall back gracefully
    try:
        val_split = _find_split(data_dir, mode, "test")
    except FileNotFoundError:
        val_split = _find_split(data_dir, mode, "val")

    print(f"  [{mode}] train_split={train_split}  val_split={val_split}")

    train_ds = TSRDDataset(
        data_dir=data_dir,
        mode=mode,
        split=train_split,
        seq_len=seq_len,
        stride=seq_len // 2,
        max_files=train_files,
        max_windows_per_file=150,
        cache_in_memory=True
    )

    val_ds = TSRDDataset(
        data_dir=data_dir,
        mode=mode,
        split=val_split,
        seq_len=seq_len,
        stride=seq_len,
        max_files=val_files,
        max_windows_per_file=100,
        cache_in_memory=True
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=False
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False
    )

    return train_loader, val_loader


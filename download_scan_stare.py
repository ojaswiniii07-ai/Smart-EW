"""
TSRD Scan & Stare Downloader — Optimized for MacBook M4 (3-4 hr Training Budget)

Downloads a balanced, representative subset of both Scan and Stare modes:
- Scan:
    train_scan: 100 files (~180 MB)
    val_scan:    20 files (~35 MB)
    test_scan:   20 files (~35 MB)
- Stare:
    train_stare: 30 files (~450 MB)
    val_stare:   10 files (~150 MB)
    test_stare:  10 files (~150 MB)

Total to download: ~1.0 GB (~190 files)
"""

import os
import sys
import time
from huggingface_hub import login, hf_hub_download

# Hugging Face Authentication
hf_token = os.environ.get("HF_TOKEN")
if hf_token:
    login(token=hf_token, add_to_git_credential=False)

REPO = "alan-turing-institute/turing-synthetic-radar-dataset"
OUTDIR = "./tsrd_subset"

DOWNLOAD_PLAN = [
    # (mode, split, count)
    ("scan",  "train_scan", 100),
    ("scan",  "val_scan",    20),
    ("scan",  "test_scan",   20),
    ("stare", "train_stare", 30),
    ("stare", "val_stare",   10),
    ("stare", "test_stare",  10),
]

def download_split(mode, split, count):
    print(f"\n[{mode.upper()}] Downloading {count} files for {split}...")
    dest_dir = os.path.join(OUTDIR, mode, split)
    os.makedirs(dest_dir, exist_ok=True)
    
    downloaded = 0
    skipped = 0
    total_size = 0

    for i in range(count):
        fname = f"{mode}/{split}/config_{i}.h5"
        dest = os.path.join(OUTDIR, fname)
        
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            skipped += 1
            total_size += os.path.getsize(dest)
            print(f"  [{i+1:>3}/{count}] SKIP  {fname} (already on disk)")
            continue
            
        try:
            hf_hub_download(
                repo_id=REPO,
                filename=fname,
                repo_type="dataset",
                local_dir=OUTDIR,
            )
            downloaded += 1
            fsize = os.path.getsize(dest)
            total_size += fsize
            print(f"  [{i+1:>3}/{count}] OK    {fname} ({fsize / 1e6:.1f} MB)")
        except Exception as e:
            print(f"  [{i+1:>3}/{count}] FAIL  {fname}: {e}", file=sys.stderr)

    print(f"Finished {split}: {downloaded} downloaded, {skipped} skipped. Total: {total_size / 1e6:.1f} MB")

def main():
    print("=" * 65)
    print("TSRD Scan & Stare Downloader — MacBook M4 Budget (~1 GB)")
    print("=" * 65)
    t0 = time.time()

    for mode, split, count in DOWNLOAD_PLAN:
        download_split(mode, split, count)

    elapsed = time.time() - t0
    print("\n" + "=" * 65)
    print(f"All downloads finished in {elapsed / 60:.1f} minutes!")
    
    # Calculate total disk usage
    total_bytes = sum(
        os.path.getsize(os.path.join(dp, f))
        for dp, _, files in os.walk(OUTDIR)
        for f in files if f.endswith(".h5")
    )
    print(f"Total HDF5 datasets on disk: {total_bytes / 1e9:.2f} GB")
    print("=" * 65)

if __name__ == "__main__":
    main()

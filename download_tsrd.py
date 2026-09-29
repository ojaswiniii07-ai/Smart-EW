"""
TSRD Subset Downloader — MacBook M4 (3-4 hr training)
Downloads:
  - 200 train files  (~2.3 GB)
  -  25 val files    (~280 MB)
  -  25 test files   (~280 MB)
Total: ~2.8 GB
"""

import os
import sys
import time
from huggingface_hub import login, hf_hub_download

hf_token = os.environ.get("HF_TOKEN")
if hf_token:
    login(token=hf_token, add_to_git_credential=False)

REPO   = "alan-turing-institute/turing-synthetic-radar-dataset"
OUTDIR = "./tsrd_subset"
os.makedirs(f"{OUTDIR}/archive/train", exist_ok=True)
os.makedirs(f"{OUTDIR}/archive/val",   exist_ok=True)
os.makedirs(f"{OUTDIR}/archive/test",  exist_ok=True)

def download(split, indices):
    total = len(indices)
    for n, i in enumerate(indices, 1):
        fname = f"archive/{split}/{split}_{i}.h5"
        dest  = os.path.join(OUTDIR, fname)
        if os.path.exists(dest):
            print(f"  [{n:>3}/{total}] SKIP  {fname} (already exists)")
            continue
        try:
            hf_hub_download(
                repo_id=REPO,
                filename=fname,
                repo_type="dataset",
                local_dir=OUTDIR,
            )
            size_mb = os.path.getsize(dest) / 1e6
            print(f"  [{n:>3}/{total}] OK    {fname}  ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"  [{n:>3}/{total}] ERROR {fname}: {e}", file=sys.stderr)

print("=" * 60)
print("TSRD Subset Download — M4 Training Budget")
print("=" * 60)

t0 = time.time()

print("\n[1/3] Train set (train_0 … train_199) — 200 files")
download("train", range(200))

print("\n[2/3] Val set   (val_0   … val_24)   — 25 files")
download("val", range(25))

print("\n[3/3] Test set  (test_0  … test_24)  — 25 files")
download("test", range(25))

elapsed = time.time() - t0
print(f"\n✓ Done in {elapsed/60:.1f} min — files saved to {os.path.abspath(OUTDIR)}")

# Print disk usage
total_bytes = sum(
    os.path.getsize(os.path.join(dp, f))
    for dp, _, files in os.walk(OUTDIR)
    for f in files
)
print(f"  Total size on disk: {total_bytes/1e9:.2f} GB")

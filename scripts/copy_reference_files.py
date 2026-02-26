#!/usr/bin/env python3
"""
Copy reference files from fewfs and duckcells into absurder-sql/ported_code/
for use while implementing the Hybrid OPFS+IDB storage backend.

Usage:
    python copy_reference_files.py

This script will:
  1. Clone fewfs from GitHub into a temp directory
  2. Create absurder-sql/ported_code/ (if it doesn't exist)
  3. Copy relevant OPFS/IDB/storage files from fewfs and duckcells
  4. Clean up the temp clone
"""

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# --- Configuration ---

ABSURDER_SQL_DIR = Path(r"c:\Users\npiesco\absurder-sql")
DUCKCELLS_DIR = Path(r"c:\Users\npiesco\duckcells")
FEWFS_REPO_URL = "https://github.com/npiesco/fewfs.git"

PORTED_CODE_DIR = ABSURDER_SQL_DIR / "ported_code"

# Files to copy from fewfs (relative to repo root)
FEWFS_FILES = [
    # OPFS storage backend — the primary reference
    "src/opfs/opfs_store.rs",
    "src/opfs/hybrid.rs",
    "src/opfs/bridge.rs",
    "src/opfs/mod.rs",
    # IDB storage backend — for comparison with our wasm_indexeddb.rs
    "src/idb/idb_store.rs",
    "src/idb/mod.rs",
    "src/idb/schema.rs",
    "src/idb/leader.rs",
    # Storage layer traits and types
    "src/storage/types.rs",
    "src/storage/cache.rs",
    "src/storage/cached.rs",
    "src/storage/buffered.rs",
    "src/storage/fenced.rs",
    "src/storage/checksum.rs",
    "src/storage/recovery.rs",
    "src/storage/retry.rs",
    "src/storage/mem.rs",
    "src/storage/mod.rs",
    # JS shim for runtime OPFS detection
    "bindings/shim.js",
]

# Files to copy from duckcells (relative to repo root)
DUCKCELLS_FILES = [
    # OPFS cache layer (TypeScript reference)
    "app/opfs-cache.ts",
]


def clone_fewfs(dest: Path) -> bool:
    """Clone fewfs into dest. Returns True on success."""
    print(f"  Cloning fewfs into {dest} ...")
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", FEWFS_REPO_URL, str(dest)],
            check=True,
            capture_output=True,
            text=True,
        )
        print("  Clone successful.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: git clone failed: {e.stderr.strip()}", file=sys.stderr)
        return False


def copy_files(src_root: Path, dest_subdir: str, file_list: list[str]) -> int:
    """
    Copy files from src_root into PORTED_CODE_DIR/dest_subdir,
    preserving directory structure.
    Returns count of files copied.
    """
    copied = 0
    for rel_path in file_list:
        src = src_root / rel_path
        dst = PORTED_CODE_DIR / dest_subdir / rel_path

        if not src.exists():
            print(f"  SKIP (not found): {src}")
            continue

        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  COPY: {rel_path}")
        copied += 1

    return copied


def write_readme():
    """Write an explanatory README into ported_code/."""
    readme = PORTED_CODE_DIR / "README.md"
    readme.write_text(
        """\
# Ported Reference Code

Reference files copied from sibling projects for implementing the
**Hybrid OPFS+IDB storage backend** in AbsurderSQL.

See `docs/HYBRID_OPFS_PLAN.md` for the full implementation plan.

## Sources

### `fewfs/` — Offline log forensics workstation (Rust/WASM)
- `src/opfs/` — **Primary reference.** OPFS `SyncAccessHandle` block storage,
  Hybrid OPFS+IDB orchestration, `web-sys`/`js_sys` OPFS bindings.
- `src/idb/` — IndexedDB block store (for comparison).
- `src/storage/` — `BlockReader`/`BlockWriter`/`Manifest` traits, caching,
  checksumming, crash recovery, retry logic.
- `bindings/shim.js` — Runtime OPFS→IDB fallback detection.

### `duckcells/` — Browser spreadsheet powered by DuckDB SQL
- `app/opfs-cache.ts` — OPFS as an Arrow IPC cache layer (TypeScript).

## Usage

These files are **read-only references** — do not edit them directly.
Use them to understand the OPFS patterns, then implement equivalents
in `src/storage/wasm_opfs.rs` and `src/storage/hybrid_store.rs`.
""",
        encoding="utf-8",
    )
    print("  WRITE: README.md")


def main():
    print("=" * 60)
    print("AbsurderSQL — Copy Reference Files for Hybrid OPFS+IDB")
    print("=" * 60)

    # 1. Create ported_code/ if needed
    if PORTED_CODE_DIR.exists():
        print(f"\nported_code/ already exists at {PORTED_CODE_DIR}")
    else:
        PORTED_CODE_DIR.mkdir(parents=True)
        print(f"\nCreated {PORTED_CODE_DIR}")

    # 2. Clone fewfs into temp
    print("\n--- fewfs ---")
    tmp_dir = Path(tempfile.mkdtemp(prefix="fewfs_clone_"))
    fewfs_dir = tmp_dir / "fewfs"

    try:
        if not clone_fewfs(fewfs_dir):
            print("Cannot proceed without fewfs. Continuing with duckcells only.")
            fewfs_count = 0
        else:
            fewfs_count = copy_files(fewfs_dir, "fewfs", FEWFS_FILES)
            print(f"  Copied {fewfs_count}/{len(FEWFS_FILES)} files from fewfs.")
    finally:
        # 3. Clean up temp clone
        print(f"\n  Cleaning up temp clone at {tmp_dir} ...")
        shutil.rmtree(tmp_dir, ignore_errors=True)
        print("  Done.")

    # 4. Copy duckcells files
    print("\n--- duckcells ---")
    if not DUCKCELLS_DIR.exists():
        print(f"  WARNING: duckcells not found at {DUCKCELLS_DIR}", file=sys.stderr)
        duckcells_count = 0
    else:
        duckcells_count = copy_files(DUCKCELLS_DIR, "duckcells", DUCKCELLS_FILES)
        print(f"  Copied {duckcells_count}/{len(DUCKCELLS_FILES)} files from duckcells.")

    # 5. Write README
    print("\n--- README ---")
    write_readme()

    # Summary
    total = fewfs_count + duckcells_count
    print("\n" + "=" * 60)
    print(f"Done. {total} reference files copied to:")
    print(f"  {PORTED_CODE_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()

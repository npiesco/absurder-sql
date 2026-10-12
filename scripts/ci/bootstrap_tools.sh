#!/bin/bash
set -euo pipefail
: "${HOME:?}"
: "${RUNNER_TOOL_CACHE:?}"
export CARGO_HOME="${CARGO_HOME:-$HOME/.cargo}"
export RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"
export PATH="$CARGO_HOME/bin:$RUNNER_TOOL_CACHE/bin:$PATH"
export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-4}"
mkdir -p "$RUNNER_TOOL_CACHE/bin"
if ! command -v rustup >/dev/null; then
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl --proto '=https' --tlsv1.2 --fail --silent --show-error https://sh.rustup.rs -o "$installer"
  sh "$installer" -y --profile minimal --default-toolchain 1.98.0 --no-modify-path
  rm -f "$installer"
  trap - EXIT
fi
rustup toolchain install 1.98.0 --profile minimal --component rustfmt --component clippy --target wasm32-unknown-unknown
rustup default 1.98.0
if ! command -v wasm-pack >/dev/null || [[ $(wasm-pack --version) != "wasm-pack 0.14.0" ]]; then
  cargo install wasm-pack --version 0.14.0 --locked
fi
bindgen_version=$(python3 -c 'import tomllib; print(next(p["version"] for p in tomllib.load(open("Cargo.lock","rb"))["package"] if p["name"]=="wasm-bindgen"))')
if ! command -v wasm-bindgen-test-runner >/dev/null || [[ $(wasm-bindgen-test-runner --version) != "wasm-bindgen-test-runner $bindgen_version" ]]; then
  cargo install wasm-bindgen-cli --version "$bindgen_version" --locked
fi
if ! command -v wasm-opt >/dev/null || [[ $(wasm-opt --version) != "wasm-opt version 132 (version_132)" ]]; then
  python3 - <<'PY'
import hashlib, io, os, platform, tarfile, urllib.request
from pathlib import Path
architecture = platform.machine()
asset_arch = "x86_64" if architecture == "x86_64" else "aarch64" if architecture == "aarch64" else None
if asset_arch is None:
    raise RuntimeError(f"Unsupported Binaryen runner architecture: {architecture}")
name = f"binaryen-version_132-{asset_arch}-linux.tar.gz"
url = "https://github.com/WebAssembly/binaryen/releases/download/version_132/" + name
with urllib.request.urlopen(url, timeout=120) as response:
    data = response.read()
with urllib.request.urlopen(url + ".sha256", timeout=30) as response:
    expected = response.read().decode().split()[0]
if hashlib.sha256(data).hexdigest() != expected:
    raise RuntimeError("Binaryen distribution checksum mismatch")
destination = Path(os.environ["RUNNER_TOOL_CACHE"])
with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
    archive.extractall(destination, filter="data")
link = destination / "bin" / "wasm-opt"
if link.exists() or link.is_symlink():
    link.unlink()
link.symlink_to(destination / "binaryen-version_132" / "bin" / "wasm-opt")
PY
fi
rustc --version
wasm-pack --version
wasm-bindgen-test-runner --version
wasm-opt --version
if [[ -n ${GITHUB_PATH:-} ]]; then
  printf '%s\n' "$CARGO_HOME/bin" "$RUNNER_TOOL_CACHE/bin" >> "$GITHUB_PATH"
fi

#!/bin/bash
set -euo pipefail
test ! -e .git
export CARGO_BUILD_JOBS="${CARGO_BUILD_JOBS:-4}"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$HOME/../cache/target}"
export CARGO_TERM_COLOR=always
export BENCHMARK_SWEEP=1
export PYTHON=python3
test "$(df --output=avail -B1 . | tail -1 | tr -d ' ')" -gt 10737418240
runtime_identity() {
  python3 - <<'PY'
import hashlib, json
from pathlib import Path
root = Path("pkg")
files = {str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
         for path in sorted(root.rglob("*"))
         if path.is_file() and not any(part.startswith(".") for part in path.relative_to(root).parts)}
if not files or not (root / "absurder_sql_bg.wasm").is_file():
    raise RuntimeError("Missing built runtime")
print(json.dumps(files, sort_keys=True))
PY
}
python3 -m unittest discover -s tests/ci -p 'test_*.py' -v
cargo fmt --all -- --check
cargo clippy --all-targets --features telemetry,fs_persist -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib -- -D warnings
cargo clippy --target wasm32-unknown-unknown --lib --features telemetry -- -D warnings
cargo test -- --test-threads=1
wasm-pack build --target web --out-dir pkg --release --no-opt
wasm-opt -Oz pkg/absurder_sql_bg.wasm -o pkg/absurder_sql_bg.wasm
tested_runtime=$(runtime_identity)
wasm-pack test --headless --chrome --release
node tests/e2e/fixtures/telemetry-server.mjs &
collector=$!
trap 'kill "$collector" 2>/dev/null || true; wait "$collector" 2>/dev/null || true' EXIT
python3 - <<'PY'
import json, time, urllib.error, urllib.request
deadline = time.monotonic() + 15
while True:
    try:
        with urllib.request.urlopen("http://127.0.0.1:18082/health", timeout=2) as response:
            assert json.load(response)["ready"]
        break
    except urllib.error.URLError:
        if time.monotonic() >= deadline:
            raise
        time.sleep(0.1)
PY
HEADLESS=1 CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUNNER=wasm-bindgen-test-runner \
  cargo test --locked --target wasm32-unknown-unknown --release --features telemetry \
  --test telemetry_stabilization --test metrics_query_execution_tests \
  --test telemetry_tracing_instrumentation_test --test export_config_test
kill "$collector"
wait "$collector" || test "$?" -eq 143
trap - EXIT
npm --prefix examples/vite-app install --package-lock=false
npx --no-install playwright test --retries=0 --reporter=line
npm run test:deletion -- --retries=0 --reporter=line
npm run test:stabilization -- --retries=0 --reporter=line
npm run sync:pwa-package
npm --prefix pwa install --package-lock=false
npm --prefix pwa exec -- playwright install chromium
npm --prefix pwa run test:pwa -- --retries=0 --reporter=line
cargo build --release
wasm-pack build --target web --out-dir pkg --release --no-opt
wasm-opt -Oz pkg/absurder_sql_bg.wasm -o pkg/absurder_sql_bg.wasm
if [[ $(runtime_identity) != "$tested_runtime" ]]; then
  printf 'Post-regression runtime bytes differ from the tested package\n' >&2
  exit 1
fi
mkdir -p dist-ci
printf '%s\n' "$tested_runtime" > dist-ci/runtime-sha256.json
npm pack --ignore-scripts --json --pack-destination dist-ci > dist-ci/npm-pack.json
cargo package --locked --no-verify
crate=$(python3 -c 'import tomllib; p=tomllib.load(open("Cargo.toml","rb"))["package"]; print(p["name"]+"-"+p["version"]+".crate")')
cp "$CARGO_TARGET_DIR/package/$crate" dist-ci/
python3 - <<'PY'
import hashlib, json
from pathlib import Path
root = Path("dist-ci")
manifest = [{"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
             "bytes": path.stat().st_size}
            for path in sorted(root.iterdir()) if path.suffix in (".tgz", ".crate")]
if len(manifest) != 2:
    raise RuntimeError("Expected one npm archive and one crate archive")
(root / "artifact-sha256.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest, indent=2))
PY

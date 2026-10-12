#!/bin/bash
set -euo pipefail
exec python3 "$(dirname -- "$0")/runner_job_guard.py"

#!/usr/bin/env bash
# Create an isolated virtualenv and install backend deps to avoid clashing with system/pip AWS CLI.
set -euo pipefail

python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "[info] Backend venv ready. Activate with: source $(pwd)/.venv/bin/activate"

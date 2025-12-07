#!/usr/bin/env bash
# Wrapper to deploy the backend stack using infra/config.env (or CONFIG_PATH override).

set -euo pipefail

CONFIG_PATH="${CONFIG_PATH:-infra/config.env}"

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "[error] Config not found: ${CONFIG_PATH}" >&2
  echo "Copy infra/config.example.env to infra/config.env and edit values." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "[info] Deploying backend with config ${CONFIG_PATH}"
pushd "${REPO_ROOT}/infra" >/dev/null
bash setup_from_config.sh --config "$(realpath "${CONFIG_PATH}")"
popd >/dev/null

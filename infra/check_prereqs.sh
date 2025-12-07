#!/usr/bin/env bash
# Lightweight prerequisite checker for phtracker infra deploys.
# Usage: ./check_prereqs.sh [--ssm-param /path/to/jwt_audience]

set -o nounset
set -o pipefail

SSM_PARAM="/phtracker/dev/jwt_audience"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssm-param)
      SSM_PARAM="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ERRORS=0

note() { echo "[info] $*"; }
warn() { echo "[warn] $*"; ERRORS=$((ERRORS + 1)); }

check_cmd() {
  local cmd="$1" install_hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    warn "Missing command: $cmd (install hint: $install_hint)"
    return 1
  fi
  return 0
}

note "Repo root: ${REPO_ROOT}"

detect_python() {
  if command -v python3.12 >/dev/null 2>&1; then
    echo "python3.12"
  elif command -v python3 >/dev/null 2>&1; then
    echo "python3"
  elif command -v python >/dev/null 2>&1; then
    echo "python"
  else
    echo ""
  fi
}

PY_CMD=$(detect_python)
if [[ -z "${PY_CMD}" ]]; then
  warn "Python 3.12 not found (install hint: conda install python=3.12 -n phtracker)"
else
  pyver=$($PY_CMD - <<'PY'
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}")
PY
  )
  major="${pyver%%.*}"
  minor="${pyver#*.}"
  if [[ "$major" -lt 3 || "$minor" -lt 12 ]]; then
    warn "Python version is ${pyver}, need 3.12+ (using ${PY_CMD})"
  else
    note "Python OK (${pyver}, ${PY_CMD})"
  fi
fi

if check_cmd aws "pip install awscli && aws configure"; then
  if aws sts get-caller-identity >/dev/null 2>&1; then
    note "AWS CLI configured (sts get-caller-identity succeeded)"
  else
    warn "AWS CLI not configured or creds invalid (aws sts get-caller-identity failed)"
  fi
fi

check_cmd sam "brew install aws-sam-cli | pip install aws-sam-cli" && note "SAM CLI OK ($(sam --version))"

if check_cmd docker "Install Docker Desktop or docker-ce"; then
  if docker info >/dev/null 2>&1; then
    note "Docker daemon running"
  else
    warn "Docker CLI found but daemon is not running or inaccessible"
  fi
fi

if [[ -d "${REPO_ROOT}/backend" ]]; then
  note "Backend path exists (${REPO_ROOT}/backend)"
else
  warn "Backend path missing (${REPO_ROOT}/backend); add FastAPI+Mangum app before deploy"
fi

if command -v aws >/dev/null 2>&1; then
  if aws ssm get-parameter --name "${SSM_PARAM}" --query Parameter.Value --output text >/dev/null 2>&1; then
    note "SSM param exists: ${SSM_PARAM}"
  else
    warn "SSM param missing or inaccessible: ${SSM_PARAM} (create with: aws ssm put-parameter --name \"${SSM_PARAM}\" --value \"<jwt_audience>\" --type String --overwrite)"
  fi
fi

if [[ $ERRORS -eq 0 ]]; then
  note "All prerequisite checks passed."
else
  warn "Prerequisite checks found ${ERRORS} issue(s). See warnings above."
fi

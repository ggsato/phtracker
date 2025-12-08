#!/usr/bin/env bash
# Wrapper to deploy the backend stack using infra/config.env (or CONFIG_PATH override).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_PATH="${CONFIG_PATH:-infra/config.env}"

# Resolve config path: allow absolute, repo-relative, or infra-relative.
if [[ "${CONFIG_PATH}" = /* ]]; then
  RESOLVED_CONFIG="${CONFIG_PATH}"
elif [[ -f "${REPO_ROOT}/${CONFIG_PATH}" ]]; then
  RESOLVED_CONFIG="${REPO_ROOT}/${CONFIG_PATH}"
elif [[ -f "${REPO_ROOT}/infra/${CONFIG_PATH}" ]]; then
  RESOLVED_CONFIG="${REPO_ROOT}/infra/${CONFIG_PATH}"
else
  echo "[error] Config not found: ${CONFIG_PATH}" >&2
  echo "Copy infra/config.example.env to infra/config.env and edit values." >&2
  exit 1
fi

echo "[info] Deploying backend with config ${RESOLVED_CONFIG}"

# Load config values for SSM handling.
set -a
source "${RESOLVED_CONFIG}"
set +a

: "${SSM_JWT_AUDIENCE_PARAM:?SSM_JWT_AUDIENCE_PARAM must be set in the config}"
STACK_NAME="${APP_NAME}-${ENV}"
AWS_DEPLOY_REGION="${REGION:-${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-northeast-1}}}"

ensure_ssm_param() {
  if ! command -v aws >/dev/null 2>&1; then
    echo "[warn] aws CLI not available; cannot ensure SSM param ${SSM_JWT_AUDIENCE_PARAM}" >&2
    return
  fi
  if aws ssm get-parameter --name "${SSM_JWT_AUDIENCE_PARAM}" --region "${AWS_DEPLOY_REGION}" >/dev/null 2>&1; then
    echo "[info] SSM param exists: ${SSM_JWT_AUDIENCE_PARAM}"
    return
  fi
  local placeholder="placeholder-${ENV}-jwt-audience"
  echo "[info] Creating placeholder SSM param ${SSM_JWT_AUDIENCE_PARAM} (value=${placeholder})"
  aws ssm put-parameter \
    --name "${SSM_JWT_AUDIENCE_PARAM}" \
    --value "${placeholder}" \
    --type String \
    --overwrite \
    --region "${AWS_DEPLOY_REGION}"
}

ensure_ssm_param

pushd "${REPO_ROOT}/infra" >/dev/null
bash setup_from_config.sh --config "${RESOLVED_CONFIG}"
popd >/dev/null

# After deploy, if we have a UserPoolClientId output, update the SSM param with the real value.
if command -v aws >/dev/null 2>&1; then
  CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${AWS_DEPLOY_REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
    --output text 2>/dev/null || true)
  if [[ -n "${CLIENT_ID}" && "${CLIENT_ID}" != "None" ]]; then
    CURRENT_VALUE=$(aws ssm get-parameter --name "${SSM_JWT_AUDIENCE_PARAM}" --region "${AWS_DEPLOY_REGION}" --query Parameter.Value --output text 2>/dev/null || true)
    if [[ "${CURRENT_VALUE}" != "${CLIENT_ID}" ]]; then
      echo "[info] Updating SSM param ${SSM_JWT_AUDIENCE_PARAM} with UserPoolClientId ${CLIENT_ID}"
      aws ssm put-parameter \
        --name "${SSM_JWT_AUDIENCE_PARAM}" \
        --value "${CLIENT_ID}" \
        --type String \
        --overwrite \
        --region "${AWS_DEPLOY_REGION}"
      echo "[info] SSM param updated. Re-run this deploy to propagate the audience into Lambda env vars."
    else
      echo "[info] SSM param already matches UserPoolClientId"
    fi
  else
    echo "[warn] Could not read UserPoolClientId output for stack ${STACK_NAME}; SSM param unchanged."
  fi
else
  echo "[warn] aws CLI not available; skipping SSM param update post-deploy."
fi

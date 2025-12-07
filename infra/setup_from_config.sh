#!/usr/bin/env bash
# Config-driven setup helper. Reads infra/config.env (copy from config.example.env).
# 1) Runs prerequisite checks (with SSM param from config)
# 2) Optionally runs sam build/deploy if RUN_DEPLOY=true in config
#
# Usage: ./setup_from_config.sh [--config path]

set -o errexit
set -o nounset
set -o pipefail

CONFIG_PATH="config.env"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)
      CONFIG_PATH="$2"
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

if [[ ! -f "${SCRIPT_DIR}/${CONFIG_PATH}" ]]; then
  echo "[error] Config file not found: ${SCRIPT_DIR}/${CONFIG_PATH}" >&2
  echo "Copy config.example.env to ${CONFIG_PATH} and edit values." >&2
  exit 1
fi

set -a
source "${SCRIPT_DIR}/${CONFIG_PATH}"
set +a

echo "[info] Using config: ${SCRIPT_DIR}/${CONFIG_PATH}"
echo "[info] APP_NAME=${APP_NAME} ENV=${ENV}"

bash "${SCRIPT_DIR}/check_prereqs.sh" --ssm-param "${SSM_JWT_AUDIENCE_PARAM}"

if [[ "${RUN_DEPLOY}" != "true" ]]; then
  echo "[info] RUN_DEPLOY is not 'true'; skipping sam build/deploy. Set RUN_DEPLOY=true to enable."
  exit 0
fi

if [[ ! -d "${REPO_ROOT}/backend" ]]; then
  echo "[error] backend/ directory missing; cannot build Lambda." >&2
  exit 1
fi

pushd "${SCRIPT_DIR}" >/dev/null
echo "[info] Running sam build..."
sam build --use-container

echo "[info] Running sam deploy..."
PARAM_OVERRIDES=(
  Env="${ENV}"
  AppName="${APP_NAME}"
  CorsAllowedOrigins="${CORS_ALLOWED_ORIGINS}"
  CognitoCallbackURLs="${COGNITO_CALLBACK_URLS}"
  CognitoLogoutURLs="${COGNITO_LOGOUT_URLS}"
  JwtAudienceParam="${SSM_JWT_AUDIENCE_PARAM}"
)

if [[ -n "${CUSTOM_DOMAIN_NAME}" && -n "${CUSTOM_DOMAIN_CERT_ARN}" ]]; then
  PARAM_OVERRIDES+=(
    CustomDomainName="${CUSTOM_DOMAIN_NAME}"
    CustomDomainCertArn="${CUSTOM_DOMAIN_CERT_ARN}"
  )
fi

sam deploy --stack-name "${APP_NAME}-${ENV}" --resolve-s3 --capabilities CAPABILITY_IAM \
  --parameter-overrides "${PARAM_OVERRIDES[@]}"
popd >/dev/null

echo "[info] Setup finished."

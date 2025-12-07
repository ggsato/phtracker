#!/usr/bin/env bash
# Deletes the backend CloudFormation stack defined in infra/config.env (or CONFIG_PATH override).

set -euo pipefail

CONFIG_PATH="${CONFIG_PATH:-infra/config.env}"

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "[error] Config not found: ${CONFIG_PATH}" >&2
  exit 1
fi

APP_NAME="$(grep '^APP_NAME=' "${CONFIG_PATH}" | cut -d'=' -f2)"
ENV="$(grep '^ENV=' "${CONFIG_PATH}" | cut -d'=' -f2)"

if [[ -z "${APP_NAME}" || -z "${ENV}" ]]; then
  echo "[error] APP_NAME or ENV missing in ${CONFIG_PATH}" >&2
  exit 1
fi

STACK_NAME="${APP_NAME}-${ENV}"

echo "[warn] Deleting stack ${STACK_NAME} in ap-northeast-1..."
aws cloudformation delete-stack --stack-name "${STACK_NAME}" --region ap-northeast-1
aws cloudformation wait stack-delete-complete --stack-name "${STACK_NAME}" --region ap-northeast-1
echo "[info] Stack ${STACK_NAME} deleted."

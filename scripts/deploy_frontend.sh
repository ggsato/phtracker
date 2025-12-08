#!/usr/bin/env bash
# Builds the frontend and deploys it to S3 + CloudFront.
# Required env: FRONTEND_BUCKET, CLOUDFRONT_DISTRIBUTION_ID
# Optional: REGION (default ap-northeast-1), SKIP_BUILD=true to reuse existing dist/

set -euo pipefail

REGION="${REGION:-ap-northeast-1}"
BUCKET="${FRONTEND_BUCKET:-}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
SKIP_BUILD="${SKIP_BUILD:-false}"

if [[ -z "${BUCKET}" || -z "${DISTRIBUTION_ID}" ]]; then
  echo "[error] FRONTEND_BUCKET and CLOUDFRONT_DISTRIBUTION_ID must be set." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ "${SKIP_BUILD}" != "true" ]]; then
  echo "[info] Building frontend (uses .env.production)..."
  pushd "${REPO_ROOT}" >/dev/null
  npm run build
  popd >/dev/null
else
  echo "[info] SKIP_BUILD=true; using existing dist/ contents."
fi

if [[ ! -d "${REPO_ROOT}/dist" ]]; then
  echo "[error] dist/ not found. Build first or set SKIP_BUILD=false." >&2
  exit 1
fi

echo "[info] Syncing dist/ to s3://${BUCKET} (region ${REGION})..."
aws s3 sync "${REPO_ROOT}/dist/" "s3://${BUCKET}/" --delete --cache-control "public,max-age=300" --region "${REGION}"

echo "[info] Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"

echo "[info] Frontend deploy complete."

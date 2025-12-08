#!/usr/bin/env bash
# Tears down frontend artifacts: optionally clears S3 bucket and deletes the CloudFront distribution.
# Required env: FRONTEND_BUCKET, CLOUDFRONT_DISTRIBUTION_ID
# Optional: REGION (default ap-northeast-1), DELETE_DIST=true to delete the distribution after disabling.

set -euo pipefail

REGION="${REGION:-ap-northeast-1}"
BUCKET="${FRONTEND_BUCKET:-}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
DELETE_DIST="${DELETE_DIST:-false}"

if [[ -z "${BUCKET}" || -z "${DISTRIBUTION_ID}" ]]; then
  echo "[error] FRONTEND_BUCKET and CLOUDFRONT_DISTRIBUTION_ID must be set." >&2
  exit 1
fi

echo "[info] Emptying s3://${BUCKET} ..."
aws s3 rm "s3://${BUCKET}/" --recursive --region "${REGION}"

if [[ "${DELETE_DIST}" == "true" ]]; then
  echo "[info] Disabling CloudFront distribution ${DISTRIBUTION_ID} ..."
  # Fetch current config
  aws cloudfront get-distribution-config --id "${DISTRIBUTION_ID}" --output json > /tmp/cf-config.json
  ETAG=$(python - <<'PY'
import json
c = json.load(open("/tmp/cf-config.json"))
print(c["ETag"])
PY
)
  python - <<'PY'
import json
c = json.load(open("/tmp/cf-config.json"))
cfg = c["DistributionConfig"]
cfg["Enabled"] = False
json.dump(cfg, open("/tmp/cf-dist.json", "w"))
PY
  aws cloudfront update-distribution --id "${DISTRIBUTION_ID}" --if-match "${ETAG}" --distribution-config file:///tmp/cf-dist.json
  echo "[info] Waiting 60s before delete..."
  sleep 60
  echo "[info] Deleting CloudFront distribution ${DISTRIBUTION_ID} ..."
  aws cloudfront delete-distribution --id "${DISTRIBUTION_ID}" --if-match "${ETAG}"
fi

echo "[info] Frontend undeploy complete."

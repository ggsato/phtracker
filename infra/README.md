# phtracker infrastructure (SAM)

## Prereqs
- AWS CLI configured (`AWS_PROFILE`/`AWS_REGION`)
- AWS SAM CLI + Docker (for container builds)
- Python 3.12 runtime and FastAPI+Mangum app in `backend/`
- SSM parameters created for JWT audience (`/phtracker/dev/jwt_audience`, etc.)
- If SAM or Docker are missing, run `bash infra/install_prereqs.sh` (Debian/Ubuntu automates Docker; others may need manual Docker install).

## Quick start (config-driven)
1) Copy `infra/config.example.env` to `infra/config.env` and edit values (app name, env, CORS origins, Cognito URLs, SSM param path). Set `RUN_DEPLOY=true` to let the script deploy.
2) Run the helper (it checks prereqs; deploys only if `RUN_DEPLOY=true`):
   ```bash
   cd infra
   bash setup_from_config.sh
   ```
   (Wrapper available: `bash scripts/deploy_backend.sh`)
3) Optional: to use a custom domain, set `CUSTOM_DOMAIN_NAME` and `CUSTOM_DOMAIN_CERT_ARN` in `config.env`. The ACM cert must be in the same region as the API Gateway. Create a DNS record (CNAME/A alias) pointing `CUSTOM_DOMAIN_NAME` to the API Gateway domain output after deploy.

## Manual deploy (dev)
```bash
cd infra
sam build --use-container
sam deploy --stack-name phtracker-dev --resolve-s3 --capabilities CAPABILITY_IAM \
  --parameter-overrides Env=dev AppName=phtracker \
  CorsAllowedOrigins=http://localhost:5173 \
  CognitoCallbackURLs=http://localhost:5173/callback \
  CognitoLogoutURLs=http://localhost:5173 \
  EnableApiAuth=true
```

Outputs include the HTTP API URL, DynamoDB table name, User Pool ID, and App Client ID.

## Notes
- DynamoDB table uses PK `PK` and SK `SK`; store items with prefixes (PROFILE#, PHLOG#, FOOD#, MODEL#).
- `JwtAudienceParam` resolves from SSM so we do not commit client IDs or secrets; update per stage (`/phtracker/prod/jwt_audience`, etc.).
- `JwtIssuer` parameter is optional; by default it uses the Cognito issuer for the created User Pool.
- JWT authorizer is always enabled for the HTTP API; `JwtAudienceParam` must match the SPA app client ID. Lambda also accepts the User Pool ID for access tokens.
- CORS: `AllowOrigins`/headers/methods are set from `CORS_ALLOWED_ORIGINS`; `AllowCredentials` is true. An OPTIONS `{proxy+}` route is configured with no authorizer so preflight bypasses JWT auth.
- For local-only bypass, run the backend with `ALLOW_DEV_AUTH=true` (and optionally `DEMO_USER_ID`) instead of disabling auth in SAM.

# Work Summary

- Rebuilt Simple Mode input: toggles for whole/decimal (0.25 steps, range 5.0–7.5) with auto-save, responsive 2-column layout, centered pH display, neutral/acid/alkaline color bands, decimal `.75` hidden when whole=7, and removal of redundant labels.
- Updated acidity band defaults (acidic ≤5.75, slightly acidic ≤6.5, neutral ≤7.25, slightly alkaline ≤7.5; alkaline above) and switched neutral to a green palette.
- Expert Mode now uses a multi-thumb range slider to adjust pH band breakpoints; removed icon settings block.
- Header controls: language menu is a globe icon; profile switcher uses a group icon; removed per-user icon settings.
- i18n copy updated for new defaults; lint clean on latest changes (`npm run lint`).
- Backend scaffold added: FastAPI + Mangum app (`backend/`) with DynamoDB access (profiles, ph-logs, foods), health/me endpoints, dev-friendly JWT sub extraction, and requirements pinned for Lambda python3.12.
- Backend local workflow now uses an isolated venv via `backend/setup.sh` to avoid AWS CLI/botocore conflicts.
- Backend defaults: `TABLE_NAME` defaults to `phtracker-dev`, `AWS_REGION`/`REGION` defaults to `us-east-1` so the app can start locally; README updated with sample env.
- Frontend API client now targets FastAPI routes (`/profiles`, `/ph-logs`, `/foods`), sends `x-user-id` from `VITE_API_USER_ID`, and maps date/notes payloads to the backend shape; README updated with `.env.local` guidance.
- End-to-end local flow verified: FastAPI bound to 0.0.0.0 with DynamoDB table in ap-northeast-1, frontend pointed at LAN host via `VITE_API_BASE_URL`, profile created, and pH log stored successfully (UI offline warning cleared).

## Upcoming steps (service + deploy)
- Define IaC (SAM/Serverless): DynamoDB single table (PK USER#id, SK prefixes), FastAPI Lambda, API Gateway HTTP API, Cognito User Pool/App Client, SSM params for secrets/public config.
- Implement FastAPI app with Mangum: routes `/me`, `/profiles`, `/ph-logs`, `/foods`; JWT verify against Cognito JWKs; minimal logging/error mapping. **(scaffold in place; tighten JWT verification/logging next)**
- Seed PRAL data into DynamoDB via one-time loader (batch write script/Lambda), validate sample queries.
- Wire frontend env to Cognito + API Gateway; add PWA bits (manifest, service worker), build Simple Mode default route against live API.
- Deploy backend: `sam build --use-container && sam deploy --stack-name phtracker-dev --resolve-s3 --capabilities CAPABILITY_IAM`; confirm `/health`/CRUD smoke tests.
- Deploy frontend to S3 + CloudFront; invalidate cache; on-device PWA install/offline check.

## Updates (Dec 2025)
- Cognito JWT verification implemented (JWK fetch/cache, issuer/audience checks) accepting both ID tokens and access tokens (aud/client_id/token_use aware). Dev bypass remains opt-in via `ALLOW_DEV_AUTH`.
- SAM template fixes: always-on JWT authorizer for HTTP API; CORS allows credentials; OPTIONS `{proxy+}` bypasses auth; deploy script now resolves config paths and auto-seeds/updates SSM audience param.
- Staging stack deployed (`phtracker-stg`): API `https://ktnchz1fu7.execute-api.ap-northeast-1.amazonaws.com`, UserPool `ap-northeast-1_ObwaU1IQD`, App Client `5nm0499r55mveim1mc0t2ocdns`; Hosted UI domain set in Cognito.
- Frontend auth wired to Cognito (Hosted UI PKCE, bearer tokens). Local staging test: use `.env.stg`, run `npm run dev -- --mode stg`, ensure Cognito callback/logout allow `http://localhost:5173/callback` / `http://localhost:5173`.
- CORS/auth issues resolved: preflight passes, audience mismatch fixed, profiles load after sign-in against staging API.

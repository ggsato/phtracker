# phtracker backend (FastAPI + Mangum)

## Run locally (venv)
```bash
cd backend
bash setup.sh      # creates .venv and installs deps
source .venv/bin/activate
TABLE_NAME=phtracker-dev AWS_REGION=us-east-1 uvicorn main:app --reload --port 8000
```

## Lambda handler
- SAM `Handler`: `main.handler`
- Expects env vars: `TABLE_NAME`, `REGION`, `USER_POOL_ID`, `USER_POOL_CLIENT_ID`, `JWT_AUDIENCE`, `JWT_ISSUER` (set by template). Optional dev-only bypass: set `ALLOW_DEV_AUTH=true` with `DEMO_USER_ID` or send `x-user-id` header to avoid Cognito during local testing.

## Routes
- `GET /health` – basic liveness/status.
- `GET /me` – echoes `user_id` from bearer token (`sub`) or `x-user-id` header (dev fallback uses `DEMO_USER_ID`).
- `GET /profiles` / `POST /profiles` – list/create profiles (PK `USER#<user_id>`, SK `PROFILE#<profile_id>`).
- `GET /ph-logs` (query params: `profile_id`, optional `start`, `end`) – list logs.
- `POST /ph-logs` – upsert a log.
- `GET /foods` – basic PRAL lookup (scan with filters on name/category/pral range).

## Notes
- DynamoDB table schema: PK `PK`, SK `SK`, with prefixes: `PROFILE#`, `PHLOG#<profile_id>#<date>`, `FOOD#<id>`, etc.
- JWTs are verified against Cognito JWKs; audience/issuer must match env. Dev bypass is opt-in with `ALLOW_DEV_AUTH=true`.
- Use the virtualenv (`.venv`) to avoid conflicts with system AWS CLI/botocore.
- Defaults: if `TABLE_NAME` is unset, it falls back to `phtracker-dev`; `AWS_REGION`/`REGION` falls back to `us-east-1`. Provide real values that point to your table when testing.
- Optional: `DYNAMODB_ENDPOINT` to point at a local DynamoDB endpoint; otherwise uses AWS by region.

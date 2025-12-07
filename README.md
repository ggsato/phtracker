# pH Tracker

Family-friendly pH logging app with a grandma-first simple mode, richer expert tools, and a PWA shell. See `PROJECT_SUMMARY.md` for the broader architecture, AWS plan, and roadmap.

## Features
- Simple Mode (`/`): big controls, autosave in 0.25 steps, quick notes, and color-coded pH bands.
- Expert Mode (`/expert`): stats cards, adjustable acidity breakpoints, and PRAL quick search with offline cache placeholders for charts/filters.
- Profiles: switch who you are tracking; defaults seed `Me` and `Grandma`, and persisted to `localStorage`.
- Offline-first: service worker (Vite PWA) caches pages and API calls with `NetworkFirst`; logs, PRAL lookups, bands, locale, and profile choices are also cached locally.
- Bilingual UI: English/Japanese toggle via the header; preference stored per device.

## Tech Stack
- React 18 + TypeScript + Vite, Chakra UI theme with brand palette, React Router, TanStack Query.
- Vite PWA plugin for manifest/service worker.
- Vitest + Testing Library; ESLint with TypeScript/React plugins.

## Getting Started
1) Install Node.js 18+ and npm.  
2) Install deps: `npm install`  
3) Run dev server: `npm run dev` (defaults to port 5173) or `npm run dev:host` to bind `0.0.0.0:8080`.  
4) Build for production: `npm run build` and preview locally with `npm run preview`.

## Environment
- `VITE_API_BASE_URL` (optional): API origin for `/profiles`, `/ph-logs`, `/foods`. Defaults to `/api` so you can proxy during local dev (set to `http://localhost:8000` to hit the FastAPI dev server).
- `VITE_API_USER_ID` (optional): injected as `x-user-id` header for local/demo use when Cognito/JWT is not wired yet.
- Everything else runs client-side; data is synced when the API is reachable and kept locally when offline.

Create a `.env.local` in the project root for local API:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_USER_ID=demo-user
```

## Scripts
- `npm run dev` – start Vite in dev mode.
- `npm run build` – production bundle.
- `npm run preview` – serve the built bundle locally.
- `npm run lint` – ESLint on `src/**/*.{ts,tsx}`.
- `npm test` / `npm run test:watch` – Vitest (jsdom, threads disabled for determinism).
- `bash scripts/deploy_backend.sh` – deploys the AWS backend using `infra/config.env`.
- `FRONTEND_BUCKET=... CLOUDFRONT_DISTRIBUTION_ID=... bash scripts/deploy_frontend.sh` – build + sync `dist/` to S3 and invalidate CloudFront.
- `bash scripts/undeploy_backend.sh` – delete the backend stack (`APP_NAME-ENV` from `infra/config.env`).
- `FRONTEND_BUCKET=... CLOUDFRONT_DISTRIBUTION_ID=... bash scripts/undeploy_frontend.sh` – empty S3 bucket; with `DELETE_DIST=true` disables and deletes the distribution.

### Handy AWS lookups
- Backend outputs (stack name = `APP_NAME-ENV`, e.g. `phtracker-prod`):
  ```
  aws cloudformation describe-stacks --stack-name phtracker-prod --region ap-northeast-1 \
    --query "Stacks[0].Outputs"
  ```
- CloudFront DistributionId for the frontend alias:
  ```
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?Aliases.Items[?@=='app.phtracker.kenkoichiban.jp']].{Id:Id,Domain:DomainName}"
  ```
- S3 bucket listing (to find your frontend bucket):
  ```
  aws s3 ls
  ```

## Key Concepts (from the summary)
- Simple vs. Advanced modes align with the AWS/Lambda/DynamoDB design in `PROJECT_SUMMARY.md`, with per-profile preferences and future Garmin/modeling hooks.
- pH logs, PRAL searches, and profile context always include `profile_id` when calling the backend to match the single-table DynamoDB design.
- Deploy as a static PWA (S3 + CloudFront recommended); costs and scaling expectations are outlined in the summary doc.

## Project Layout
- `src/App.tsx` – routing and header (mode toggle, language switcher, profile switcher).
- `src/pages/SimpleMode.tsx` – quick-entry UI with autosave and note shortcuts.
- `src/pages/ExpertMode.tsx` – stats, pH band editor, PRAL search hook-up points for analytics.
- `src/hooks/` – profile/log/PRAL/pH band state with local caching.
- `src/lib/apiClient.ts` – fetch wrapper that injects `profile_id` and respects `VITE_API_BASE_URL`.
- `public/manifest.webmanifest` + `vite.config.ts` – PWA manifest and runtime caching rules.

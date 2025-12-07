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
3) Run dev server: `npm run dev` (defaults to port 5173).  
4) Build for production: `npm run build` and preview locally with `npm run preview`.

## Environment
- `VITE_API_BASE_URL` (optional): API origin for `/profiles`, `/profiles/:id/ph-logs`, and `/pral/search`. Defaults to `/api` so you can proxy during local dev.
- Everything else runs client-side; data is synced when the API is reachable and kept locally when offline.

## Scripts
- `npm run dev` – start Vite in dev mode.
- `npm run build` – production bundle.
- `npm run preview` – serve the built bundle locally.
- `npm run lint` – ESLint on `src/**/*.{ts,tsx}`.
- `npm test` / `npm run test:watch` – Vitest (jsdom, threads disabled for determinism).

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

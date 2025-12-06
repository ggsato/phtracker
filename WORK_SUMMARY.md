# Work Summary

- Added simple i18n layer with Language toggle (日本語/English) in the header; default locale is Japanese and remembered in localStorage.
- Localized UI text via translations across simple/expert modes, tooltips, PRAL search, and aria labels; set `index.html` `lang="ja"`.
- Kept profile-aware API calls and offline caches intact; PRAL search/cache now respects localization for UI messages.
- Ran `npm run lint` and `npm run test` to confirm status after changes.
- Dev server is currently running on `0.0.0.0:8080` (see `/tmp/phtracker-dev.log`; PID 52084).

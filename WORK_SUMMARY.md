# Work Summary

- Rebuilt Simple Mode input: toggles for whole/decimal (0.25 steps, range 5.0–7.5) with auto-save, responsive 2-column layout, centered pH display, neutral/acid/alkaline color bands, decimal `.75` hidden when whole=7, and removal of redundant labels.
- Updated acidity band defaults (acidic ≤5.75, slightly acidic ≤6.5, neutral ≤7.25, slightly alkaline ≤7.5; alkaline above) and switched neutral to a green palette.
- Expert Mode now uses a multi-thumb range slider to adjust pH band breakpoints; removed icon settings block.
- Header controls: language menu is a globe icon; profile switcher uses a group icon; removed per-user icon settings.
- i18n copy updated for new defaults; lint clean on latest changes (`npm run lint`).

# Changelog

## Unreleased

### Added
- **Reactive Hub integration** — dedicated browser window for login and source browsing (`Tray → Reactive Library`)
- **Automatic source discovery** — hidden background scanner uses MutationObserver on the Reactive sources page to detect new members; extracts labels from `.text-lg.font-semibold` elements
- **Blacklist system** — when removing a source, its URL is added to a blacklist so it is never re-added automatically; "Clear Blacklist" tray item shows and resets the count
- **Remove confirmation dialog** — warns that removing a source will also blacklist its URL, with "Remove & Blacklist" button
- **"Connect to Reactive Fugi Tech" first-launch placeholder** — guides new users through setup; overlay hides when login opens, reappears after login completes
- **"Edit Sources" tray toggle** — toggles edit mode on and off (not just on)
- **"Reset Position" tray menu** — moves overlay to bottom-left of the current display
- **Settings stored in `settings.json`** — layout, window position, and other preferences persistent across restarts
- **Multi-screen position saving** — window position saved on move and restored on next launch
- **Shared `persist:reactive` session** — all webviews and hub share cookies; one login authenticates everything
- **`--test-fresh` CLI flag** — launches with empty sources and isolated session for testing the first-run experience
- **`preload-hub.js`** — isolated preload script for the sources background scanner window
- **`poll` npm script** — `npm run poll` alternative entry point
- **Settings validation** — type checks on `windowX`, `windowY`, and `layout` on load with graceful defaults
- **Sources data repair** — validates and repairs malformed source entries; auto-migrates legacy array format to `{ sources, blacklist }` object format
- **Renderer interval cleanup** — clears all polling intervals on `beforeunload` to prevent timer leaks

### Changed
- **Architecture refactor** — `main.js` (376 lines) and `renderer.js` (549 lines) split into modular `src/` structure:
  - **Main process**: `src/main/` with separate modules for windows (overlay, hub, sourcesBackground), IPC handlers (sources, settings, overlay, hub), tray (index, menu), storage (settingsStore, sourcesStore), state management, and a thin orchestrator
  - **Renderer**: `src/renderer/` with separate modules for state, cards, dragdrop, modal, resize, and index
  - **Shared**: `src/shared/` with centralized constants (IPC channels, window dimensions, URLs) and a structured logger
- **Single-instance lock** — prevents multiple application windows; second launch restores the existing window
- **Structured logger** — timestamped, tagged logging with file path sanitization; error boundaries on all IPC handlers and startup

### Fixed
- **Webview session partition race** — partition attribute is now set before `src` so webviews correctly share the authenticated session
- **Glass drag region stuck** — drag region now restored to default after first-launch placeholder is replaced by source cards
- **Login detection for SPAs** — `did-navigate-in-page` handler catches Reactive's pushState navigation after login
- **Hub window auto-hide on library page** — library opened from tray no longer auto-hides (login watcher only attached for initial login flow)
- **Source labels** — scanner now correctly extracts usernames (e.g. `samthegoat_`) as labels instead of raw URLs
- **Overlay hidden properly** — placeholder click uses `win.hide()` (not CSS opacity) matching the tray Show/Hide behaviour
- **Initial window size** — increased to 350×250 to accommodate the first-launch placeholder
- **RequestAnimationFrame resize** — double-rAF ensures accurate dimensions before resize IPC fires
- **Tray menu architecture** — menu template separated from tray creation, enabling dynamic rebuild when blacklist changes without recreating the tray icon

### Maintenance
- **Changelog cleanup** — merged duplicate `### Added` and `### Fixed` sections, reordered to Added → Changed → Fixed → Maintenance, established `.clinerules` for ongoing manual maintenance
- **README rewrite** — replaced release-please automation guide with a user-facing description of features, installation, usage, and architecture
- **`.clinerules`** — added rule prohibiting AI/automation mentions in public-facing files
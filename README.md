# Oracle

Minimal Reactive Overlay — Electron desktop application.

## Architecture

```
src/
├── shared/                  # Shared constants and logging
│   ├── constants.js         # IPC channels, dimensions, URLs, file names
│   └── logger.js            # Lightweight logger with path sanitization
│
├── main/                    # Main process (Node.js / Electron)
│   ├── index.js             # Orchestrator: loads state, wires modules, boots app
│   ├── state.js             # Central app state (settings, sources, windows, flags)
│   ├── storage/             # File I/O with validation and migration
│   │   ├── settingsStore.js
│   │   └── sourcesStore.js
│   ├── windows/             # BrowserWindow creation (one per file)
│   │   ├── overlay.js       # Transparent always-on-top overlay
│   │   ├── hub.js           # Login/library browser window
│   │   └── sourcesBackground.js  # Hidden scanner with MutationObserver
│   ├── tray/                # System tray
│   │   ├── index.js         # Tray creation + click handler
│   │   └── menu.js          # Context menu template
│   └── ipc/                 # IPC handler registration (one file per domain)
│       ├── sources.js       # Source CRUD + blacklist
│       ├── settings.js      # Settings get/set
│       ├── overlay.js       # Resize + external links
│       └── hub.js           # Hub window + scanner discovery
│
└── renderer/                # Renderer process (loaded via <script> tags)
    ├── state.js             # UI state, DOM refs, load/save helpers
    ├── cards.js             # Card creation, rendering, edit mode, removal
    ├── modal.js             # Edit/add modal + remove confirmation
    ├── dragdrop.js          # Drag-and-drop reordering + ghost canvas
    ├── resize.js            # Window resize, layout toggle, hover controls
    └── index.js             # Buttons, IPC listeners, init, cleanup
```

**Key principles:**
- `main.js` is a 3-line entry point — all logic in `src/main/index.js`
- Preload scripts (`preload.js`, `preload-hub.js`) are minimal contextBridge layers
- Renderer uses plain `<script>` tags in dependency order (no bundler)
- Single source of truth per domain: one state module, one storage module per file type
- Single instance lock prevents duplicate app processes

## Automated Releases

This project uses [Release Please](https://github.com/googleapis/release-please) for fully automated versioning, changelog generation, and GitHub Releases.

### How It Works

1. **Write code and commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add tray minimize
   fix: repair overlay scaling
   docs: update README
   refactor: split window manager
   perf: reduce overlay redraws
   build: update electron
   ci: improve workflow
   ```
2. **Push to `main`**. Release Please analyzes your commits and opens (or updates) a **Release PR**.
3. **Merge the Release PR**. Release Please then automatically:
   - Bumps the version in `package.json`
   - Generates/updates `CHANGELOG.md`
   - Creates a Git tag (e.g., `v1.4.0`)
   - Creates a GitHub Release with release notes
4. The **build workflow** triggers on the new release, builds `Oracle.exe`, and attaches it to the release.

You never need to manually edit version numbers or the changelog.

### Version Bump Rules

| Commit prefix | Version bump | Example: 1.3.1 → |
|---|---|---|
| `fix:` | patch | 1.3.2 |
| `feat:` | minor | 1.4.0 |
| `feat!:` or `fix!:` (breaking change) | major | 2.0.0 |
| `docs:`, `chore:`, `style:`, `refactor:`, `perf:`, `test:`, `ci:`, `build:` | none (no release) | — |

### Triggering a Release

Simply merge the Release PR that Release Please creates. There is no manual step — the merge itself triggers the release.

If no `feat:` or `fix:` commits have been pushed since the last release, Release Please will not create a Release PR. Push a `feat:` or `fix:` commit to start a new release cycle.

## Development

```bash
# Install dependencies
npm install

# Run the app
npm start

# Build portable exe
npm run build
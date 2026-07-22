# Oracle

A minimal Electron overlay for [Reactive](https://reactive.fugi.tech) — keep your favorite sources always visible on your desktop.

## Features

- **Always-on-top overlay** — transparent, draggable window that stays above other applications
- **Reactive integration** — login once via the Reactive Hub browser window; all sources share the authenticated session
- **Automatic source discovery** — background scanner detects new subscriptions and adds them automatically
- **Blacklist system** — remove a source once and it stays removed; clear the blacklist from the tray menu to re-scan
- **Multi-screen support** — position the overlay on any display; position is saved and restored across restarts
- **Edit mode** — toggle source visibility and reorder via drag-and-drop
- **System tray** — show/hide the overlay, edit sources, open the Reactive library, reset position, clear blacklist, and quit

## Installation

Download the latest `Oracle.exe` from the [Releases](https://github.com/SamTheGoat7/Oracle/releases) page and run it. No installer required — it's a portable executable.

## Usage

1. Launch Oracle — the overlay appears in the bottom-left corner
2. Click **"Connect to Reactive Fugi Tech"** to sign in (or use `Tray → Reactive Library`)
3. Your subscriptions appear as cards on the overlay
4. Right-click the system tray icon for options:
   - **Show/Hide** — toggle the overlay
   - **Edit Sources** — show/hide individual sources and reorder them
   - **Reactive Library** — browse subscriptions
   - **Reset Position** — move overlay to the bottom-left of the current display
   - **Clear Blacklist** — reset the removal blacklist so all sources re-scan
   - **Quit** — exit the application

## Development

```bash
# Install dependencies
npm install

# Run the app
npm start

# Build portable exe
npm run build
```

## Architecture

```
src/
├── shared/           # Constants and logging
├── main/             # Electron main process
│   ├── windows/      # BrowserWindow creation (overlay, hub, scanner)
│   ├── ipc/          # IPC handlers (sources, settings, overlay, hub)
│   ├── tray/         # System tray and context menu
│   └── storage/      # Settings and sources file I/O
└── renderer/         # Overlay UI (cards, drag-and-drop, modals)
```

## License

UNLICENSED — private software.
# Lensor — Project Context

> A Chrome Extension that overlays a draggable, zoomable lens on any webpage for pixel-level inspection and color detection.

## Overview

Lensor creates a circular "lens" UI element that floats over web pages. Users can drag the lens anywhere on the page to magnify content beneath it and detect the exact color of the center pixel. The extension generates color palettes (monochromatic harmony and Material Design tones) based on the detected color.

**Goal**: Publish to Chrome Web Store as an MVP. The core functionality works, but needs polish and bug fixes before release.

**See also**: [IDEAS.md](./IDEAS.md) — Feature backlog, MVP blockers, and future possibilities.

## Architecture

Lensor operates across three independent JavaScript execution contexts, synchronized via **Crann** (a custom state management library) and **chrome.storage.sync**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension                              │
├─────────────────────┬─────────────────────────┬─────────────────────┤
│   Service Worker    │     Content Script      │    Settings Page    │
│   (Background)      │     (Per-Tab UI)        │   (Extension Tab)   │
├─────────────────────┼─────────────────────────┼─────────────────────┤
│ • Extension APIs    │ • Shadow DOM host       │ • React app         │
│ • tabCapture        │ • React app (Lens)      │ • Live preview      │
│ • State hub         │ • Canvas rendering      │ • Saved colors      │
│ • Settings opener   │ • Drag handling         │ • Settings controls │
│                     │ • Slide drawer          │ • WebGL fisheye     │
└─────────────────────┴─────────────────────────┴─────────────────────┘
           ↕ Crann State Sync ↕              ↕ chrome.storage.sync ↕
```

### Screen Capture Flow

1. User clicks extension icon → Service Worker receives click
2. Service Worker calls `chrome.tabCapture.getMediaStreamId()`
3. UI receives `mediaStreamId` via Crann RPC
4. UI creates `MediaStream` from ID, gets `ImageCapture` instance
5. `grabFrame()` returns `ImageBitmap` of current tab
6. Lense canvas draws zoomed portion based on lens position
7. Page observers trigger recapture on scroll/resize/DOM mutations

### Inactivity Timeout Flow

The extension auto-shuts down after inactivity using Chrome Alarms API (service worker):

1. When `active` becomes `true`, service worker creates a Chrome alarm for that tab
2. User activity in the UI sends `resetInactivityTimer` message to service worker
3. Service worker recreates the alarm, resetting the countdown
4. When alarm fires:
   - Service worker looks up the agent for that tab via `getAgentStateByTabId()`
   - Sets `active: false` via Crann state
   - UI receives state change and hides
5. User can restart by clicking the extension icon

**Activity signals** (reset the timer):

- Dragging the lens
- Toggling grid/fisheye
- Changing zoom
- Opening/closing drawer
- Page scroll/resize (triggers recapture)

### State Management (Crann)

State items have two partition types:

- **`Partition.Instance`**: Per-tab state (e.g., `active`, `mediaStreamId`)
- **`Partition.Service`**: Global state shared across all tabs (e.g., `zoom`, `hoveredColor`, `colorPalette`)

Key state items:
| Item | Partition | Purpose |
|------|-----------|---------|
| `active` | Instance | Whether lens is visible on this tab |
| `mediaStreamId` | Instance | Tab capture stream identifier |
| `hoveredColor` | Service | Currently detected color (rgb string) |
| `colorPalette` | Service | Generated harmony colors (array) |
| `materialPalette` | Service | Material Design tones (object) |
| `zoom` | Service | Current zoom level |
| `showGrid` | Service | Grid overlay toggle |
| `showFisheye` | Service | Fisheye effect toggle |

## Key Features

### Core (MVP)

- **Draggable Lens**: Circular magnifying lens with drag handle
- **Zoom Control**: Adjustable magnification (1x–16x)
- **Color Detection**: Detects RGB color at lens center
- **Color Palettes**: Generates monochromatic and Material Design palettes from detected color
- **Auto-Recapture**: Re-captures page automatically on scroll and resize
- **Manual Refresh**: Button in slide drawer to manually trigger a new capture
- **Inactivity Timeout**: Configurable auto-shutdown (5-60 min or disabled) to stop screen capture
- **Saved Colors**: Save colors with heart button, view/manage in settings page

### Visual Options

- **Grid Overlay**: Shows pixel grid over magnified area
- **Fisheye Effect**: WebGL-based fisheye distortion (aesthetic feature)
- **Adaptive Theming**: Lens handle/border colors adapt to detected color
- **Handle Customization**: Toggle texture pattern, adjust opacity

### Controls (Slide Drawer)

A slide-out drawer UI attached to the lens provides quick access to settings:

- Toggle grid overlay
- Toggle fisheye effect
- Manual refresh button (re-capture the page)
- Adjust zoom level
- View current color and generated palettes
- **Save color** (heart button) — saves to collection
- **Open settings** (gear button) — opens settings page

### Settings Page

A dedicated extension page (`chrome-extension://xxx/settings/settings.html`) with tabbed UI:

**Settings Tab:**

- Default zoom, grid, fisheye states
- Animation and flash effect toggles
- Handle texture and opacity controls
- Color copy format (HEX/RGB/HSL)
- Inactivity timeout configuration
- Live preview pane with real WebGL fisheye

**Saved Colors Tab:**

- View all saved colors with palettes
- Editable labels for organization
- Copy any color to clipboard
- Delete colors individually or clear all
- Max 50 colors synced via chrome.storage.sync

## Directory Structure

```
src/
├── service-workers/
│   └── service-worker.ts    # Extension background script
├── scripts/
│   └── content-script.ts    # Minimal bootstrap (mostly unused now)
├── settings/                # Settings page (extension tab)
│   ├── index.tsx            # Entry point
│   ├── settings.html        # HTML template
│   ├── SettingsApp.tsx      # Main app with tabbed UI
│   ├── LensPreview.tsx      # Live preview component
│   ├── types.ts             # Settings types and defaults
│   ├── useSettings.ts       # Settings hook (chrome.storage.sync)
│   └── savedColors.ts       # Saved colors hook and types
├── ui/                      # Injected React app (Lens + Drawer)
│   ├── index.tsx            # Entry point, Shadow DOM setup, Crann connect
│   ├── state-config.ts      # Crann state configuration
│   ├── animations/          # Animation presets and helpers
│   ├── features/
│   │   ├── Lense/           # Main lens component and styles
│   │   └── CaptureFlash/    # Flash effect on capture
│   ├── hooks/               # React hooks for functionality
│   │   ├── useMediaCapture.ts    # Screen capture logic
│   │   ├── useDraggable.ts       # Drag behavior
│   │   ├── useCanvasLifecycle.ts # Canvas init/update management
│   │   ├── useLenseCanvasUpdate.ts # Canvas drawing
│   │   ├── useColorDetection.ts  # Color picking & palette generation
│   │   ├── useGrid.ts            # Grid overlay drawing
│   │   ├── usePageObserver.ts    # Scroll/resize/mutation detection
│   │   └── useLensorState.ts     # Crann hook wrapper
│   └── utils/               # Color, coordinate, debug utilities
├── lib/                     # WebGL fisheye implementation
│   ├── fisheyegl.ts
│   └── shaders/             # GLSL shaders
└── assets/
    ├── images/              # Extension icons
    └── styles/              # Static CSS
```

## Tech Stack

| Category       | Technology                 |
| -------------- | -------------------------- |
| Language       | TypeScript                 |
| UI Framework   | React 18                   |
| Styling        | styled-components          |
| State Sync     | Crann (custom library)     |
| Build Tool     | esbuild                    |
| Extension APIs | Manifest V3, tabCapture    |
| Graphics       | Canvas 2D, WebGL (fisheye) |

## Dependencies

### Runtime

- **crann** (`^1.0.41`): Cross-context state synchronization (author's library)
- **react** / **react-dom** (`^18.2.0`): UI framework
- **styled-components** (`^6.1.12`): CSS-in-JS styling
- **react-icons** (`^5.3.0`): Icon components

### Build

- **esbuild** (`^0.19.9`): Fast bundler
- **chokidar** (`^3.5.3`): File watching for dev builds
- **typescript** (`^5.3.3`): Type checking

## Build & Development

```bash
# Development build with watch mode
npm run watch

# Production build
npm run build

# Type checking
npm run type-check
```

The build script (`build.mjs`):

1. Auto-increments patch version in `manifest.json`
2. Bundles service worker, content script, and UI
3. Copies assets and HTML files to `dist/`

**Loading in Chrome**: Load `dist/` folder as unpacked extension at `chrome://extensions`

## Current Work

**Branch**: `feat/more-controls`

Settings page and saved colors feature:

- ✅ Settings page with tabbed UI (Settings + Saved Colors)
- ✅ Live preview pane with WebGL fisheye effect
- ✅ 9 configurable settings stored in chrome.storage.sync
- ✅ Saved colors with editable labels and computed palettes
- ✅ Lens opens centered (top 10% of viewport)
- ✅ Heart button in drawer to save colors
- ✅ Gear button in drawer to open settings

## Known Considerations

- **Version number**: Currently auto-increments on every build (dev convenience). Needs manual versioning for release.
- **Screen sharing indicator**: Chrome shows recording icon while `MediaStream` is active. Mitigated by the inactivity timeout feature which stops the stream after 20 minutes of no user interaction. User can restart by clicking the extension icon.
- **Recapture flicker**: During recapture, the lens hides/shows with some flickering. See IDEAS.md for planned animation improvements.

## Documentation

Technical documentation lives in `docs/`:

| Path                                   | Purpose                                  |
| -------------------------------------- | ---------------------------------------- |
| `docs/animation/`                      | Animation implementation references      |
| `docs/animation/stacking_inventory.md` | UI element layering and visibility audit |

## Ignored Directories

- `scratch/` — Experimental scripts, not part of the project
- `src/devtools/` — Abandoned devtools panel attempt
- `.prompts/` — Legacy AI prompt documentation (superseded by `.context/`)

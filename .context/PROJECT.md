# Lensor — Project Context

> A Chrome Extension that overlays a draggable, zoomable lens on any webpage for pixel-level inspection and color detection.

## Overview

Lensor creates a circular "lens" UI element that floats over web pages. Users can drag the lens anywhere on the page to magnify content beneath it and detect the exact color of the center pixel. The extension generates color palettes (monochromatic harmony and Material Design tones) based on the detected color.

**Goal**: Publish to Chrome Web Store as an MVP. The core functionality works, but needs polish and bug fixes before release.

**See also**: [IDEAS.md](./IDEAS.md) — Feature backlog, MVP blockers, and future possibilities.

## Architecture

Lensor operates across three independent JavaScript execution contexts, synchronized via **Crann** (a custom state management library):

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chrome Extension                           │
├─────────────────┬─────────────────────┬─────────────────────────┤
│  Service Worker │   Content Script    │       Sidepanel         │
│  (Background)   │   (Per-Tab UI)      │   (Controls Panel)      │
├─────────────────┼─────────────────────┼─────────────────────────┤
│ • Extension APIs│ • Shadow DOM host   │ • React app             │
│ • tabCapture    │ • React Lense app   │ • Settings/toggles      │
│ • State hub     │ • Canvas rendering  │ • Color display         │
│ • Sidepanel mgmt│ • Drag handling     │ • Zoom control          │
└─────────────────┴─────────────────────┴─────────────────────────┘
                          ↕ Crann State Sync ↕
```

### Screen Capture Flow

1. User clicks extension icon → Service Worker receives click
2. Service Worker calls `chrome.tabCapture.getMediaStreamId()`
3. UI receives `mediaStreamId` via Crann RPC
4. UI creates `MediaStream` from ID, gets `ImageCapture` instance
5. `grabFrame()` returns `ImageBitmap` of current tab
6. Lense canvas draws zoomed portion based on lens position
7. Page observers trigger recapture on scroll/resize/DOM mutations

### State Management (Crann)

State items have two partition types:

- **`Partition.Instance`**: Per-tab state (e.g., `active`, `mediaStreamId`, `isSidepanelShown`)
- **`Partition.Service`**: Global state shared across all tabs (e.g., `zoom`, `hoveredColor`, `colorPalette`)

Key state items:
| Item | Partition | Purpose |
|------|-----------|---------|
| `active` | Instance | Whether lens is visible on this tab |
| `mediaStreamId` | Instance | Tab capture stream identifier |
| `isSidepanelShown` | Instance | Sidepanel visibility for this tab |
| `hoveredColor` | Service | Currently detected color (rgb string) |
| `colorPalette` | Service | Generated harmony colors (array) |
| `materialPalette` | Service | Material Design tones (object) |
| `zoom` | Service | Current zoom level |
| `showGrid` | Service | Grid overlay toggle |
| `showFisheye` | Service | Fisheye effect toggle |

## Key Features

### Core (MVP)

- **Draggable Lens**: Circular magnifying lens with drag handle
- **Zoom Control**: Adjustable magnification (0.5x–16x)
- **Color Detection**: Detects RGB color at lens center
- **Color Palettes**: Generates monochromatic and Material Design palettes from detected color
- **Auto-Recapture**: Re-captures page on scroll, resize, or significant DOM changes

### Visual Options

- **Grid Overlay**: Shows pixel grid over magnified area
- **Fisheye Effect**: WebGL-based fisheye distortion (aesthetic feature)
- **Adaptive Theming**: Lens handle/border colors adapt to detected color

### Controls (Sidepanel)

- Toggle grid overlay
- Toggle fisheye effect
- Adjust zoom level
- View current color and generated palettes

## Directory Structure

```
src/
├── service-workers/
│   └── service-worker.ts    # Extension background script
├── scripts/
│   └── content-script.ts    # Minimal bootstrap (mostly unused now)
├── ui/                      # Injected React app (the Lense)
│   ├── index.tsx            # Entry point, Shadow DOM setup, Crann connect
│   ├── state-config.ts      # Crann state configuration
│   ├── features/
│   │   └── Lense/           # Main lens component and styles
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
├── sidepanel/               # Chrome sidepanel React app
│   ├── index.tsx            # Entry point
│   ├── App.tsx              # Main container
│   ├── components/          # Reusable UI components
│   └── features/            # Feature-specific components
│       ├── home/            # Main controls view
│       ├── color-palette/   # Palette display components
│       ├── colors/          # Color display component
│       ├── zoom-control/    # Zoom slider
│       └── crop-controls/   # (WIP)
├── lib/                     # WebGL fisheye implementation
│   ├── fisheyegl.ts
│   └── shaders/             # GLSL shaders
└── assets/
    ├── images/              # Extension icons
    └── styles/              # Static CSS
```

## Tech Stack

| Category       | Technology                         |
| -------------- | ---------------------------------- |
| Language       | TypeScript                         |
| UI Framework   | React 18                           |
| Styling        | styled-components                  |
| State Sync     | Crann (custom library)             |
| Build Tool     | esbuild                            |
| Extension APIs | Manifest V3, tabCapture, sidePanel |
| Graphics       | Canvas 2D, WebGL (fisheye)         |

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
2. Bundles service worker, content script, UI, and sidepanel
3. Copies assets and HTML files to `dist/`

**Loading in Chrome**: Load `dist/` folder as unpacked extension at `chrome://extensions`

## Current Work

**Branch**: `feat/color-palettes`

Implementing color palette generation from the detected pixel color:

- Monochromatic color harmony generation
- Material Design tone generation (50–900 weights)
- Palette display in sidepanel
- Adaptive lens theming based on palette

## Known Considerations

- **Version number**: Currently auto-increments on every build (dev convenience). Needs manual versioning for release.
- **Screen sharing indicator**: Chrome shows recording icon while `MediaStream` is active. Consider closing stream after each capture.
- **Recapture timing**: May capture the lens itself if not hidden. Position may reset during recapture.

## Ignored Directories

- `scratch/` — Experimental scripts, not part of the project
- `src/devtools/` — Abandoned devtools panel attempt
- `.prompts/` — Legacy AI prompt documentation (superseded by `.context/`)

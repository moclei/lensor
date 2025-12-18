# Visual Stacking Inventory

> A comprehensive audit of Lensor's view elements, their DOM order, and visibility states. Created to inform animation implementation.

## Overview

This document catalogs all visual elements rendered by the Lensor UI, with particular attention to:
- DOM hierarchy (tree order)
- Visual stacking (determined by DOM order)
- Visibility control mechanisms
- Pointer event handling

Understanding these layers is essential before implementing coordinated show/hide animations.

---

## Terminology

| Term | Refers To |
|------|-----------|
| **Handle** | `StyledRingHandle` - the draggable ring frame around the lens |
| **Lenses** | The central visual elements: `MainCanvas`, `GridCanvas`, `GlassOverlay` |
| **Drawer** | `ControlDrawer` - the expandable control panel with settings and palettes |
| **Flash** | `CaptureFlash` - the radial pulse animation during screen capture |

---

## 1. DOM Hierarchy (Tree Order)

The actual DOM structure as rendered. **DOM order determines visual stacking** — elements later in the tree render on top.

```
<body>
└── #lensor-shadow-container (position: fixed, z-index: 2147483647)
    └── ShadowRoot (closed)
        ├── <div> (style slot for styled-components)
        ├── <style> (font styles)
        └── <div> (uiRoot, height: 100%)
            │
            ├── CaptureFlash (conditional: when animating)
            │   └── FlashContainer (z-index: 2147483646)
            │       ├── FlashOverlay
            │       ├── PulseRing
            │       └── InnerPulse
            │
            └── Lense
                └── LenseContainer (position: fixed, z-index: 9999990)
                    │
                    │   # Visual stacking via DOM order (first = bottom, last = top)
                    ├── Handle (id: lensor-ring-handle)      ← BOTTOM (behind glass)
                    ├── MainCanvas (id: lensor-main-canvas)
                    ├── GlassOverlay
                    ├── GridCanvas (id: lensor-grid-canvas)  ← TOP (crosshairs visible)
                    │
                    ├── HiddenCanvas (fisheye - display: none)
                    ├── HiddenCanvas (inter - display: none)
                    ├── ControlDrawer (conditional: when canvasesVisible)
                    │   └── DrawerContainer (z-index: 20)
                    │       ├── PullTab
                    │       └── DrawerPanel
                    │           └── DrawerContent
                    │
                    └── DebugOverlay (conditional: when debugMode)
```

### Key Points

1. **Handle comes FIRST** — It renders behind the Lenses, appearing as a frame
2. **No z-index on core elements** — Handle, MainCanvas, GlassOverlay, GridCanvas use natural DOM stacking
3. **Handle extends beyond Lenses** — It's 460×460px while Lenses are 400×400px, creating the visible ring

---

## 2. Visual Stacking Order

Within the `LenseContainer` stacking context:

| Layer | Element | Size | Notes |
|-------|---------|------|-------|
| 1 (bottom) | **Handle** | 460×460px | Extends 30px outside Lenses on all sides |
| 2 | **MainCanvas** | 400×400px | The magnified view |
| 3 | **GlassOverlay** | 400×400px | Vignette, shadow effects |
| 4 (top) | **GridCanvas** | 400×400px | Grid lines & crosshairs |

**Above the Lenses:**

| Element | z-index | Notes |
|---------|---------|-------|
| **DrawerContainer** | `20` | Pull tab + expandable panel |
| **StyledDebugOverlay** | `9999997` | Debug mode only |
| **StyledDebugInfo** | `9999999` | Debug mode only |

**Sibling stacking context:**

| Element | z-index | Notes |
|---------|---------|-------|
| **FlashContainer** | `2147483646` | Full viewport, capture animation |

---

## 3. The Visual Sandwich

How elements stack visually (bottom to top):

```
        TOP (closest to user)
        ─────────────────────
              DebugInfo                   ← Debug mode only
              DebugOverlay                ← Debug mode only
              DrawerContainer             ← Controls UI
              GridCanvas                  ← Grid overlay & crosshairs
              GlassOverlay                ← Lens glass effects
              MainCanvas                  ← The magnified content
              Handle                      ← Drag ring (extends OUTSIDE)
        ─────────────────────
        BOTTOM (furthest from user)
        
        ═══════════════════════════════════════════
        SEPARATE STACKING CONTEXT (sibling):
        FlashContainer                    ← Capture animation
```

---

## 4. Visibility Control

All visible elements use **opacity transitions** for smooth animations. Visibility is gated on first image capture to prevent on/off/on flash.

| Element | Mechanism | Controlled By | Animation |
|---------|-----------|---------------|-----------|
| **Shadow Container** | `visibility: visible/hidden` | `active` state | N/A (outer container) |
| **Handle** | `opacity` + `transform` | `canvasesVisible` | Preset-driven |
| **MainCanvas** | `opacity` + `transform` | `canvasesVisible` | Preset-driven |
| **GlassOverlay** | `opacity` + `transform` | `canvasesVisible` | Preset-driven |
| **GridCanvas** | `opacity` + `transform` | `canvasesVisible` | Preset-driven |
| **ControlDrawer** | `opacity` only | `canvasesVisible` | Preset-driven (no transform) |
| **CaptureFlash** | Conditional render | `isAnimating` | CSS keyframes |
| **HiddenCanvas** (×2) | Always `display: none` | N/A | N/A (processing only) |

### Visibility Flow

1. Extension activates → `active=true` → Lens stays hidden (waiting for image)
2. First capture completes → `imageBitmap` arrives → `canvasesVisible=true` → Entrance animation
3. Recaptures → Lens stays visible with previous image → New image swaps in
4. Extension deactivates → `active=false` → Exit animation → Hidden

### ControlDrawer Transform Limitation

The ControlDrawer cannot use `transform` in animations because its positioning relies on `transform: translateX(-50%)` or `translateY(-50%)` for centering. Inline animation transforms would overwrite the positioning. Opacity-only animation is used instead.

---

## 5. Pointer Events Map

| Element | pointer-events | Purpose |
|---------|----------------|---------|
| Shadow Container | `none` | Pass-through to page |
| LenseContainer | `none` | Pass-through to children |
| MainCanvas | `auto` | Color detection clicks |
| GlassOverlay | `none` | Visual only |
| GridCanvas | `auto` | Receives events |
| **Handle** | **`auto`** | **Primary drag surface** |
| PullTab | `auto` | Drawer toggle |
| DrawerPanel | `auto`/`none` | Interactive when open |

### Why Handle Receives Drag Events

The Handle's draggable ring area (outer 30px) is **not covered by the Lenses**:

```
┌─────────────────────────────┐  ← Handle outer edge (460×460)
│  ╔═══════════════════════╗  │
│  ║                       ║  │  ← 30px ring (draggable area)
│  ║    ╔═════════════╗    ║  │
│  ║    ║             ║    ║  │
│  ║    ║   Lenses    ║    ║  │  ← 400×400 (MainCanvas, etc.)
│  ║    ║             ║    ║  │
│  ║    ╚═════════════╝    ║  │
│  ║                       ║  │
│  ╚═══════════════════════╝  │
└─────────────────────────────┘
```

- User drags on the ring → pointer events hit Handle directly
- User clicks on center → pointer events hit GridCanvas/MainCanvas

---

## 6. Handle Design

The Handle is positioned first in DOM order and renders behind the Lenses. Its center is permanently clipped using a CSS `mask` with radial-gradient:

```css
mask: radial-gradient(
  circle at center,
  transparent 200px,  /* canvasSize / 2 */
  black 200px
);
```

This creates a true ring shape — the center 400px diameter is transparent, ensuring the Handle never accidentally renders content there (e.g., during animations before Lenses appear).

---

## 7. Animation Preset System

Animations are controlled via a preset system in `src/ui/animations/`:

```
src/ui/animations/
├── index.ts              # Exports active preset
├── types.ts              # AnimationPreset interface
└── presets/
    └── fade-scale.ts     # Default preset
```

### Preset Structure

```typescript
interface AnimationPreset {
  name: string;
  description: string;
  handle: ElementAnimation;   // Handle animation config
  lenses: ElementAnimation;   // MainCanvas, GlassOverlay, GridCanvas
  drawer: ElementAnimation;   // ControlDrawer (opacity only)
}

interface ElementAnimation {
  hidden: CSSProperties;      // State when not visible
  visible: CSSProperties;     // State when visible
  transition: string;         // CSS transition string
}
```

### Switching Presets

Change `ACTIVE_PRESET_NAME` in `src/ui/animations/index.ts`:

```typescript
const ACTIVE_PRESET_NAME = 'fade-scale';  // Change to switch presets
```

### Current Preset: `fade-scale`

- Subtle 0.95→1.0 scale with opacity fade
- 200ms duration, ease-out easing
- Drawer has 100ms delay after lens appears

---

## Future Considerations

### Additional Presets
Create new presets in `src/ui/animations/presets/` for different animation styles:
- `loupe-placement`: Handle first, then Lenses fade in
- `drop-in`: Bounce/elastic effect
- `aperture`: Iris-style reveal

### Preset Selector UI
Add a debug UI or keyboard shortcut to cycle through presets during development.

### Exit Animations
Currently using the same preset for entrance. Could add separate exit configuration if different effects are desired.

---

## Related Files

| File | Contains |
|------|----------|
| `src/ui/features/Lense/Lense.tsx` | Main component, element composition, animation wiring |
| `src/ui/features/Lense/Lense.styles.ts` | Canvas and container styled-components |
| `src/ui/features/Lense/Handle.tsx` | Handle component with clip-path mask |
| `src/ui/features/Lense/ControlDrawer.tsx` | Drawer component |
| `src/ui/features/Lense/ControlDrawer.styles.ts` | Drawer styles (z-index: 20) |
| `src/ui/features/CaptureFlash/CaptureFlash.tsx` | Flash animation component |
| `src/ui/index.tsx` | Shadow DOM setup, container styles |
| `src/ui/animations/index.ts` | Animation preset registry, active preset export |
| `src/ui/animations/types.ts` | AnimationPreset interface, getAnimationStyle helper |
| `src/ui/animations/presets/fade-scale.ts` | Default fade+scale preset |
| `src/ui/hooks/useCanvasLifecycle.ts` | Visibility gating on first image |

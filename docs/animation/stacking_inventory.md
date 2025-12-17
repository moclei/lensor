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

## 4. Visibility Control Matrix

Elements use different mechanisms for show/hide:

| Element | Mechanism | Controlled By |
|---------|-----------|---------------|
| **Shadow Container** | `visibility: visible/hidden` | `active` state |
| **MainCanvas** | `display: block/none` | `canvasesVisible` |
| **GridCanvas** | `display: block/none` | `canvasesVisible` |
| **GlassOverlay** | `display: block/none` | `canvasesVisible` |
| **Handle** | `display: block/none` (inline style) | `canvasesVisible` |
| **ControlDrawer** | Conditional render (mount/unmount) | `canvasesVisible` |
| **CaptureFlash** | Conditional render (mount/unmount) | `isAnimating` |
| **HiddenCanvas** (×2) | Always `display: none` | N/A (processing only) |

### Animation Implications

- **`display` changes** cannot be animated directly
- **Conditional renders** prevent exit animations (element unmounts immediately)
- **Mixed approaches** make coordinated choreography difficult
- Consider unifying to CSS transform/opacity for animated transitions

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

## 6. Handle Design Note

The Handle is positioned first in DOM order and renders behind the Lenses. Its center area (the 400×400px region) is covered by the Lenses, so it's never visible. For animations where the Handle might briefly appear without the Lenses, consider:

1. Adding a `clip-path` to the Handle to make the center transparent
2. Coordinating animation timing so Handle and Lenses appear together

---

## Future Considerations

### Visibility Unification
Unifying all visibility control to use CSS transform/opacity would enable:
- Coordinated entry/exit animations
- Exit animations (elements stay mounted)
- CSS-only choreography with animation-delay

### Drawer Animations
Currently mounts/unmounts with `canvasesVisible`. Would need to stay mounted for animated transitions.

---

## Related Files

| File | Contains |
|------|----------|
| `src/ui/features/Lense/Lense.tsx` | Main component, element composition |
| `src/ui/features/Lense/Lense.styles.ts` | Canvas and container styled-components |
| `src/ui/features/Lense/Handle.tsx` | Handle component and styles |
| `src/ui/features/Lense/ControlDrawer.tsx` | Drawer component |
| `src/ui/features/Lense/ControlDrawer.styles.ts` | Drawer styles (z-index: 20) |
| `src/ui/features/CaptureFlash/CaptureFlash.tsx` | Flash animation component |
| `src/ui/index.tsx` | Shadow DOM setup, container styles |

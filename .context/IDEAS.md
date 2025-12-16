# Lensor — Ideas & Backlog

> Feature ideas, improvements, and future possibilities for Lensor.

## MVP Blockers

Issues that need resolution before Chrome Web Store release:

- [x] **Lens appears in recaptures** — Hide lens before taking new screenshot ✓ Fixed
- [x] **Position resets on recapture** — Preserve lens position across recaptures ✓ Fixed
- [x] **Manual refresh option** — Button to manually trigger recapture ✓ Implemented
- [ ] **DOM mutation recapture toggle** — Setting to enable/disable DOM-based recapture (infrastructure exists but disabled, needs refinement)
- [x] **Screen sharing indicator** — Mitigated via inactivity timeout (20min) that stops capture and hides UI. User can restart by clicking extension icon.
- [x] **Sidepanel removal cleanup** — Sidepanel has been replaced by slide drawer UI. Remove remaining sidepanel references from code, manifest, and documentation.

## Post-MVP Enhancements

### Color Features

- [x] **Color format options** — Display/copy as HEX, RGB, HSL, HSV
- [x] **Color harmony modes** — Complementary, triadic, analogous, split-complementary ✓ Implemented (monochromatic + Material Design palettes)
- [ ] **Copy to clipboard** — One-click copy of detected color
- [ ] **Color history** — Track recently detected colors
- [ ] **Accessibility checker** — WCAG contrast ratio analysis
- [ ] **Color blind simulation** — Preview detected colors through various color blindness types

### Extension Options Page

> **Summary**: Full-page UI for advanced settings and saved palettes (keyed by URL).

A dedicated extension page (`chrome-extension://xxx/settings.html`) for features that don't fit in the compact slide drawer. Built with React and connected via Crann like other contexts.

**Key features:**

- Advanced configuration options
- Saved color palettes, keyed to the website URL where they were captured
- View, manage, and delete saved palettes
- Potential future home for other power-user features

### Live Video Mode

> **Summary**: Optional mode using continuous video stream instead of single-frame capture — enables live zoomed view for video content, with performance tradeoff.

Currently, the extension opens a MediaStream but only captures a single image frame from ~1 second of video. This mode would instead display the actual streaming video in the lens (zoomed in), making it "live" and useful for inspecting video content or animations.

**Considerations:**

- Would be slower/more resource-intensive than static capture
- Should be an optional toggle, not the default behavior
- Useful for sites playing video where you want to inspect frames in motion

### Smart Recapture Detection

> **Summary**: DOM mutation scoring system to trigger recapture only on visually significant changes.

A heuristic-based system that observes DOM mutations and assigns scores to determine what constitutes a "significant" visual change worth recapturing.

**Challenges identified during earlier prototyping:**

- Many web apps update the DOM frequently without visible changes
- Tuning the "change score" threshold is subjective and app-dependent
- Tightly coupled to the lens-hiding problem (lens must hide during recapture)
- Requires careful thought to avoid false positives and unnecessary recaptures

### Recapture Animation & Flicker Fix

> **Summary**: Smooth fade/spin animations during recapture hide/show cycle to eliminate flicker and improve UX.

Currently, recapturing causes the lens to flicker as if hiding/showing multiple times in quick succession. The source of this behavior is unclear.

**Goals:**

- Single clean hide → capture → show cycle with no flicker
- Smooth animation (fade out/in) to make the transition feel intentional
- Potentially a more sophisticated entrance animation when the lens first appears
- Explore rotational/spin effects with transparency for visual polish
- Even if animation adds time to the recapture, it may be worth it for smoother UX

### Pixel Measurement Mode

> **Summary**: Draw rulers between any two points to measure exact pixel distances — useful for verifying designs against implementations.

A mode where users can draw measurement lines on the screen:

1. Click to place the start point
2. Line extends in a straight path following the cursor
3. Click again to place the end point
4. Displays the exact pixel distance between the two points

**Motivation:**
As a web developer, verifying pixel-perfect spacing from designs (Figma, etc.) against actual implementations is often frustrating. Complex CSS hierarchies with nested positioning, margins, and padding make it hard to trace where spacing comes from. This is especially painful with browser extensions where hot-reloading isn't possible, requiring manual refresh cycles to test styling changes.

**Requirements:**

- Account for screen DPI/device pixel ratio
- Clear visual feedback (original prototype used red lines)
- Potentially multiple rulers on screen
- Exact pixel accuracy for practical development use

### Lens Improvements

- [ ] **Resizable lens** — Drag to resize the lens diameter
- [ ] **Multiple lens shapes** — Square, rounded rectangle options
- [ ] **Lens size presets** — Small/medium/large quick toggles
- [ ] **Keyboard shortcuts** — Move lens with arrow keys, toggle with hotkey
- [ ] **Smart contrast** — Auto-adjust grid/handle colors based on background
- [ ] **Auto-restart on tab focus** — When extension auto-shuts down due to inactivity, automatically restart when user returns to tab (instead of requiring icon click)

### Export & Sharing

- [ ] **Export palettes** — CSS variables, JSON, Tailwind config
- [ ] **Screenshot lens area** — Save the magnified view as image
- [ ] **Share palette** — Generate shareable link for color palette

### Page Analysis

- [ ] **Website color extraction** — Scan page for dominant colors
- [ ] **Element color inspector** — Click any element to see its colors
- [ ] **Color usage heatmap** — Visual overlay showing color distribution

### Developer Tools

- [ ] **CSS generator** — Generate CSS from color palettes
- [ ] **Design tokens export** — Create design system tokens
- [ ] **CSS variable inspector** — Show custom properties affecting hovered element

## Technical Improvements

- [ ] **Dev build versioning** — Use a sub-patch version number (e.g., `1.0.0.42`) that auto-increments during development and gets stripped for release builds. Avoids polluting actual semantic version numbers during dev cycles.
- [ ] **Performance optimization** — Reduce canvas redraws, optimize observers
- [ ] **Memory management** — Clean up ImageBitmaps properly
- [ ] **Error handling** — Graceful degradation when tabCapture fails
- [ ] **Offline support** — Ensure extension works without network
- [ ] **Test coverage** — Add unit tests for color utilities and hooks

## UI/UX Ideas

- [ ] **Onboarding tour** — First-time user guide
- [ ] **Keyboard accessibility** — Full keyboard navigation support
- [ ] **Dark/light theme** — Match system preference for drawer UI
- [ ] **Compact mode** — Minimal UI for power users
- [ ] **Lens cursor customization** — Custom cursor when hovering lens
- [ ] **Configurable inactivity timeout** — Setting to adjust the 20-minute auto-shutdown timer
- [ ] **Timeout warning** — Show visual warning before auto-shutdown (e.g., "Shutting down in 1 minute...")

## Long-term Possibilities

- [ ] **AI color suggestions** — ML-powered palette recommendations
- [ ] **Browser sync** — Sync saved palettes across devices
- [ ] **Figma/Sketch integration** — Export directly to design tools
- [ ] **Color trends database** — Compare to current design trends
- [ ] **Team features** — Share palettes with collaborators

---

_Add ideas here as they come up. Move items to "MVP Blockers" if they become release requirements._

# Lensor — Ideas & Backlog

> Feature ideas, improvements, and future possibilities for Lensor.

## MVP Blockers

Issues that need resolution before Chrome Web Store release:

- [ ] **Lens appears in recaptures** — Hide lens before taking new screenshot
- [ ] **Position resets on recapture** — Preserve lens position across recaptures
- [ ] **Manual refresh option** — Button to manually trigger recapture
- [ ] **Disable auto-recapture option** — Setting to turn off automatic recapturing
- [x] **Screen sharing indicator** — ~~Close MediaStream after each capture~~ Mitigated via inactivity timeout (20min) that stops capture and hides UI. User can restart by clicking extension icon.
- [ ] **Sidepanel styling** — Polish the control panel UI
- [ ] **Version numbering** — Switch from auto-increment to semantic versioning

## Post-MVP Enhancements

### Color Features

- [ ] **Color format options** — Display/copy as HEX, RGB, HSL, HSV
- [ ] **Copy to clipboard** — One-click copy of detected color
- [ ] **Color history** — Track recently detected colors
- [ ] **Color harmony modes** — Complementary, triadic, analogous, split-complementary
- [ ] **Accessibility checker** — WCAG contrast ratio analysis
- [ ] **Color blind simulation** — Preview detected colors through various color blindness types

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

- [ ] **Performance optimization** — Reduce canvas redraws, optimize observers
- [ ] **Memory management** — Clean up ImageBitmaps properly
- [ ] **Error handling** — Graceful degradation when tabCapture fails
- [ ] **Offline support** — Ensure extension works without network
- [ ] **Test coverage** — Add unit tests for color utilities and hooks

## UI/UX Ideas

- [ ] **Onboarding tour** — First-time user guide
- [ ] **Keyboard accessibility** — Full keyboard navigation support
- [ ] **Dark/light sidepanel theme** — Match system preference
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

*Add ideas here as they come up. Move items to "MVP Blockers" if they become release requirements.*


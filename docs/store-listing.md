# Chrome Web Store Listing — Lensor

> This document serves as the source of truth for Lensor's Chrome Web Store listing.
> Update this file when making changes to the store listing.

---

## Basic Information

**Name:** Lensor

**Short Description (132 chars max):**

> A magnifying lens for pixel-perfect color detection and palette generation

**Category:** Developer Tools

**Language:** English

---

## Detailed Description

```
🔍 LENSOR — Pixel-Perfect Color Detection

Lensor overlays a draggable magnifying lens on any webpage, letting you zoom in to inspect individual pixels and detect their exact colors. Perfect for designers, developers, and anyone who needs precise color information from websites.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ KEY FEATURES

• Magnifying Lens — Drag a circular lens anywhere on the page to zoom in on content beneath it
• Adjustable Zoom — From 0.5x to 16x magnification for any level of detail
• Color Detection — Automatically detects the RGB color at the lens center
• Color Palettes — Generates monochromatic harmony and Material Design tones from any color
• Pixel Grid — Optional grid overlay to see individual pixels clearly
• Fisheye Effect — Optional aesthetic lens distortion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 PERFECT FOR

• Checking exact colors on any website
• Verifying design implementations
• Extracting color palettes from inspiration sites
• Ensuring accessibility and contrast
• Inspecting pixel-level details in images

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 PRIVACY FOCUSED

Lensor captures the visible tab content for magnification only. All processing happens locally in your browser — no data is ever sent to external servers. The extension automatically stops capturing after 20 minutes of inactivity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 HOW TO USE

1. Click the Lensor icon in your toolbar
2. A magnifying lens appears on the page
3. Drag the lens to inspect any area
4. View detected colors and palettes in the side panel
5. Adjust zoom and toggle features as needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 ABOUT THE SCREEN RECORDING INDICATOR

Chrome shows a "sharing your screen" indicator while Lensor is active. Here's what you should know:

• Lensor only captures the current tab — not your whole screen
• Captures are processed instantly and never stored or transmitted
• No images, screenshots, or recordings are saved anywhere
• The extension automatically stops after 20 minutes of inactivity
• Click the Lensor icon anytime to turn it off immediately

We built Lensor with privacy as a priority. The tab capture API is required to make the magnifying lens work, but we've implemented automatic shutdown to ensure the capture doesn't run indefinitely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ BUILT WITH OPEN SOURCE

Lensor is built using these open-source libraries by the same developer:

• Crann — State synchronization for browser extensions
  github.com/moclei/crann

• Porter — Cross-context messaging for extensions
  github.com/moclei/porter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Built with ❤️ for the design and development community.
```

---

## Screenshots

Screenshots should be **1280x800** or **640x400** PNG/JPEG.

Recommended screenshots to create:

1. **Hero Shot** — Lens active on a colorful website, showing the magnification
2. **Color Detection** — Close-up of lens with color info visible
3. **Side Panel** — The controls panel showing palette generation
4. **Pixel Grid** — Lens with grid overlay enabled, showing individual pixels
5. **Before/After** — Split showing normal view vs magnified view

### Screenshot Captions

1. "Drag the lens anywhere to magnify and detect colors"
2. "Instant color detection with hex, RGB values"
3. "Generate beautiful color palettes automatically"
4. "Pixel-perfect inspection with grid overlay"
5. "See exactly what colors are used in any design"

---

## Promotional Images

| Size     | Purpose                           | Status         |
| -------- | --------------------------------- | -------------- |
| 440x280  | Small promo tile (search results) | ⬜ Not created |
| 1400x560 | Large promo tile (featured)       | ⬜ Not created |

---

## Store URLs

**Privacy Policy:** https://moclei.github.io/lensor/privacy-policy

**Support/Homepage:** https://github.com/moclei/lensor

---

## Permissions Justification

When publishing, Google may ask why you need certain permissions:

| Permission                  | Justification                                             |
| --------------------------- | --------------------------------------------------------- |
| `tabCapture`                | Required to capture the visible tab for magnification     |
| `tabs`                      | Required to know which tab is active for state management |
| `storage`                   | Used to persist user preferences (zoom level, settings)   |
| `scripting`                 | Required to inject the lens UI into web pages             |
| `sidePanel`                 | Used for the controls and color palette panel             |
| `host_permissions: *://*/*` | The lens needs to work on any website                     |

---

## Version History

| Version | Date | Notes           |
| ------- | ---- | --------------- |
| 1.0.0   | TBD  | Initial release |

---

## Checklist Before Submission

- [ ] Test extension on multiple websites
- [ ] Verify all features work correctly
- [ ] Create all required screenshots
- [ ] Privacy policy is hosted and accessible
- [ ] Description is free of typos
- [ ] Version number is set correctly
- [ ] ZIP file created from dist/ folder

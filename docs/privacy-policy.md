# Privacy Policy — Lensor

**Last Updated:** December 10, 2024

---

## Overview

Lensor is a browser extension that provides a magnifying lens for inspecting webpage content and detecting colors. This privacy policy explains what data Lensor accesses and how it is handled.

**In short: Lensor does not collect, store, or transmit any of your data. Everything happens locally in your browser.**

---

## Data Collection

**Lensor does not collect, store, or transmit any personal data.**

We do not:
- Collect any personal information
- Track your browsing activity
- Store screenshots or images
- Send any data to external servers
- Use analytics or tracking services
- Share data with third parties

---

## How Lensor Works (Technical Details)

To provide the magnifying lens functionality, Lensor uses Chrome's `tabCapture` API. Here's exactly what happens:

1. **When you activate Lensor**, Chrome grants temporary access to capture the visible portion of the current tab
2. **The capture is a video stream** that Lensor reads frame-by-frame to display the magnified view
3. **Each frame is processed instantly** in your browser's memory to render the zoomed lens view
4. **No frames are ever saved** to disk, sent over the network, or stored anywhere
5. **When you deactivate Lensor** (or after 20 minutes of inactivity), the capture stream is immediately stopped and released

### Why Chrome Shows "Sharing Your Screen"

Chrome displays a recording indicator whenever any extension uses the `tabCapture` API. This is a security feature built into Chrome to ensure transparency. Important clarifications:

- **Lensor only captures the current tab** — not your entire screen, other tabs, or other applications
- **The capture is ephemeral** — frames exist only momentarily in memory while rendering the lens
- **Nothing is recorded** — despite the indicator, no actual recording or storage occurs
- **You're in control** — click the Lensor icon or wait 20 minutes to stop the capture automatically

### Why We Use This API

The `tabCapture` API is the only way to create a true magnifying lens in a browser extension. Without it, we could only access the DOM structure of a page, which wouldn't capture:
- Images and graphics
- Canvas elements
- Video content
- CSS-rendered visuals
- Exact pixel colors

We built Lensor as a creative tool for designers and developers, not for surveillance. The auto-shutdown feature ensures the capture never runs indefinitely.

---

## Permissions Explained

Lensor requires certain browser permissions to function:

| Permission | Why It's Needed |
|------------|-----------------|
| **Tab Capture** | To capture the visible tab content for magnification |
| **Active Tab / Tabs** | To know which tab is currently active |
| **Storage** | To save your preferences (zoom level, settings) locally |
| **Scripting** | To inject the lens interface into web pages |
| **Side Panel** | To display the controls and color palette panel |
| **Host Permissions** | To allow the lens to work on any website you visit |

---

## Data Storage

Lensor stores only your preferences using Chrome's local storage API:

- Zoom level
- Grid overlay toggle
- Fisheye effect toggle

This data:
- Stays entirely on your device
- Is never synced to any external service
- Is automatically removed when you uninstall the extension

---

## Third-Party Services

Lensor does not integrate with any third-party services, APIs, or analytics platforms. The extension operates completely offline after installation.

---

## Open Source

Lensor is built with open-source libraries:
- [Crann](https://github.com/moclei/crann) — State management for browser extensions
- [Porter](https://github.com/moclei/porter) — Cross-context messaging

The extension code is available at [github.com/moclei/lensor](https://github.com/moclei/lensor).

---

## Children's Privacy

Lensor does not knowingly collect any information from children under 13 years of age. Since Lensor collects no data from any users, this concern does not apply.

---

## Changes to This Policy

If this privacy policy is updated, the changes will be reflected in this document with an updated "Last Updated" date.

---

## Contact

If you have questions about this privacy policy:

- **GitHub Issues:** [github.com/moclei/lensor/issues](https://github.com/moclei/lensor/issues)
- **Email:** *(Add your contact email if desired)*

---

## Summary

| Question | Answer |
|----------|--------|
| Does Lensor collect personal data? | **No** |
| Does Lensor store screenshots? | **No** |
| Does Lensor send data to servers? | **No** |
| Does Lensor track my browsing? | **No** |
| Does Lensor use analytics? | **No** |
| Can I stop the screen capture? | **Yes** — click the icon or wait 20 min |
| Where is my data processed? | **Locally in your browser only** |

---

*Last updated: December 10, 2024*

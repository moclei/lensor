/**
 * Debug logging module for Lensor
 *
 * Uses the 'debug' package for namespaced, toggleable logging.
 * Logs are disabled by default. To enable in browser console:
 *
 *   localStorage.debug = 'lensor:*'           // Enable all
 *   localStorage.debug = 'lensor:capture'     // Enable capture only
 *   localStorage.debug = 'lensor:ui,lensor:sw' // Enable multiple
 *
 * Then refresh the page.
 *
 * Available namespaces:
 *   - lensor:ui       UI injection/mounting
 *   - lensor:capture  Media stream/frame capture
 *   - lensor:canvas   Canvas lifecycle and drawing
 *   - lensor:drag     Drag handling
 *   - lensor:color    Color detection/palettes
 *   - lensor:grid     Grid overlay
 *   - lensor:observer Scroll/resize/mutation observers
 *   - lensor:sw       Service worker
 *   - lensor:state    Crann state management
 */

import createDebug from 'debug';

// Create namespaced debuggers
export const debug = {
  ui: createDebug('lensor:ui'),
  capture: createDebug('lensor:capture'),
  canvas: createDebug('lensor:canvas'),
  drag: createDebug('lensor:drag'),
  color: createDebug('lensor:color'),
  grid: createDebug('lensor:grid'),
  observer: createDebug('lensor:observer'),
  sw: createDebug('lensor:sw'),
  state: createDebug('lensor:state'),
};

// Re-export for convenience
export default debug;


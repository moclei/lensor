/**
 * Animation Preset System
 * 
 * This module provides swappable animation presets for the Lense UI.
 * Change ACTIVE_PRESET_NAME to switch between different animation styles.
 * 
 * Available presets:
 * - 'fade-scale': Subtle fade with slight scale up (default)
 * 
 * To add a new preset:
 * 1. Create a new file in ./presets/
 * 2. Import and add to PRESETS object below
 * 3. Set ACTIVE_PRESET_NAME to test it
 */

import { AnimationPreset, ElementAnimation, getAnimationStyle, noAnimationStyle } from './types';
import { fadeScale } from './presets/fade-scale';

// ============================================
// PRESET REGISTRY
// Add new presets here as they're created
// ============================================

const PRESETS: Record<string, AnimationPreset> = {
  'fade-scale': fadeScale,
  // Future presets:
  // 'loupe-placement': loupePlacement,
  // 'drop-in': dropIn,
  // 'aperture': aperture,
};

// ============================================
// ACTIVE PRESET SELECTION
// Change this to switch animation styles
// ============================================

const ACTIVE_PRESET_NAME = 'fade-scale';

// ============================================
// EXPORTS
// ============================================

/** The currently active animation preset */
export const activePreset: AnimationPreset = PRESETS[ACTIVE_PRESET_NAME] || fadeScale;

/** All available presets (for future preset selector UI) */
export const availablePresets = PRESETS;

/** Re-export types and helpers */
export { AnimationPreset, ElementAnimation, getAnimationStyle, noAnimationStyle };


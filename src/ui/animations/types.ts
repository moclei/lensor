import { CSSProperties } from 'react';

/**
 * Defines animation states and transition for a single element
 */
export interface ElementAnimation {
  /** CSS properties when element is hidden (visible=false) */
  hidden: CSSProperties;
  /** CSS properties when element is visible (visible=true) */
  visible: CSSProperties;
  /** CSS transition string (e.g., "opacity 0.3s ease-out, transform 0.3s ease-out") */
  transition: string;
}

/**
 * A complete animation preset defining how all lens elements animate
 */
export interface AnimationPreset {
  /** Unique identifier for the preset */
  name: string;
  /** Human-readable description */
  description: string;
  /** Animation for the Handle (ring frame) */
  handle: ElementAnimation;
  /** Animation for the Lenses (MainCanvas, GlassOverlay, GridCanvas) */
  lenses: ElementAnimation;
  /** Animation for the ControlDrawer */
  drawer: ElementAnimation;
}

/**
 * Helper to merge animation styles with visibility state
 */
export function getAnimationStyle(
  animation: ElementAnimation,
  visible: boolean
): CSSProperties {
  return {
    ...(visible ? animation.visible : animation.hidden),
    transition: animation.transition,
  };
}

/**
 * Helper that returns instant visibility without animations
 * Used when animations are disabled in settings
 */
export function noAnimationStyle(
  animation: ElementAnimation,
  visible: boolean
): CSSProperties {
  return {
    ...(visible ? animation.visible : animation.hidden),
    transition: 'none',
  };
}


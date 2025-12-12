import React, { useEffect, useRef, useCallback } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

/**
 * Entrance Animation Components
 *
 * Provides the "drawing" effect when the lens first appears:
 * 1. The handle texture is revealed progressively via conic gradient mask
 * 2. After completion, the center content fades in
 *
 * Note: Uses JavaScript-based animation for the conic gradient angle
 * because CSS @property doesn't work reliably in shadow DOM.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CANVAS_SIZE = 400;
const BORDER_SIZE = 60;
const HANDLE_OFFSET = BORDER_SIZE / 2; // 30px - handle extends this far outside canvas
const TOTAL_SIZE = CANVAS_SIZE + BORDER_SIZE; // 460px total

// Animation durations (milliseconds)
export const HANDLE_DRAW_DURATION = 1200; // 1.2 seconds
export const CENTER_FADE_DURATION = 400;
export const CENTER_FADE_DELAY = HANDLE_DRAW_DURATION - 200; // Start fading in slightly before handle completes
export const TOTAL_ANIMATION_DURATION =
  HANDLE_DRAW_DURATION + CENTER_FADE_DURATION;

// ============================================================================
// GLOBAL STYLES
// ============================================================================

export const EntranceAnimationGlobalStyles = createGlobalStyle`
  @keyframes lensor-fade-in {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

// ============================================================================
// HANDLE ANIMATION WRAPPER
// ============================================================================

/**
 * Wrapper that applies masks to the Handle:
 * 1. A radial gradient mask to cut out the center (making it a ring, not a solid circle)
 * 2. During animation: combined with conic gradient for progressive reveal
 *
 * The Handle component is a solid circle (460x460), but we want it to appear
 * as a ring. Normally the center canvas covers the middle, but during the
 * entrance animation the canvas is hidden, so we need to mask out the center.
 */

// Calculate the inner radius for the center cutout
// The ring is 30px wide, so the inner edge is at radius 200px (CANVAS_SIZE/2)
// The outer edge is at radius 230px (TOTAL_SIZE/2)
// For radial-gradient, percentages are relative to the gradient radius (230px for a 460px circle)
// Inner edge as percentage: 200/230 ≈ 87%
const INNER_RADIUS_PERCENT = (CANVAS_SIZE / TOTAL_SIZE) * 100; // ~87%

// The ring mask: transparent in center, opaque at the ring
const RING_MASK = `radial-gradient(circle at center, transparent ${INNER_RADIUS_PERCENT}%, black ${INNER_RADIUS_PERCENT}%)`;

export const HandleRevealWrapper = styled.div<{
  $complete: boolean;
}>`
  position: absolute;
  /* Position to align with the handle's actual position */
  top: ${-HANDLE_OFFSET}px;
  left: ${-HANDLE_OFFSET}px;
  width: ${TOTAL_SIZE}px;
  height: ${TOTAL_SIZE}px;

  /* Prevent clipping */
  overflow: visible;

  /* When animation is complete, just use the ring mask (center cutout) */
  /* During animation, the conic gradient is applied via inline style */
  mask: ${(props) => (props.$complete ? RING_MASK : undefined)};
  -webkit-mask: ${(props) => (props.$complete ? RING_MASK : undefined)};

  /* Reset the Handle's positioning since this wrapper is already positioned */
  & > * {
    top: 0 !important;
    left: 0 !important;
  }
`;

/**
 * Generate the combined mask for the handle during animation.
 *
 * Layer order matters for mask-composite:
 * - Layer 1 (first): Conic reveal - controls WHEN parts are revealed
 * - Layer 2 (second): Ring cutout - controls WHERE parts can be visible
 *
 * With mask-composite: intersect, only areas where BOTH masks are opaque will show.
 * This means: only the ring portion (not center) AND only where conic has revealed.
 *
 * @param revealAngle - Current reveal angle in degrees (0-360)
 */
export const getAnimationMask = (revealAngle: number): string => {
  // Conic gradient for progressive reveal (top layer)
  const conicMask = `conic-gradient(from -90deg at center, black 0deg, black ${revealAngle}deg, transparent ${revealAngle}deg, transparent 360deg)`;

  // Ring mask is the base layer - only the ring area can ever be visible
  // Conic mask on top determines which parts of that ring are currently revealed
  return `${conicMask}, ${RING_MASK}`;
};

// ============================================================================
// ANIMATION HOOK
// ============================================================================

export type EntrancePhase = 'idle' | 'animating' | 'complete';

interface UseEntranceAnimationOptions {
  enabled: boolean;
  onComplete?: () => void;
}

interface UseEntranceAnimationResult {
  phase: EntrancePhase;
  isAnimating: boolean;
  isComplete: boolean;
  revealAngle: number;
  startAnimation: () => void;
  resetAnimation: () => void;
}

/**
 * Hook to manage entrance animation state.
 * Uses requestAnimationFrame for smooth conic gradient animation.
 * Resets when enabled becomes false.
 */
export function useEntranceAnimation({
  enabled,
  onComplete
}: UseEntranceAnimationOptions): UseEntranceAnimationResult {
  const [phase, setPhase] = React.useState<EntrancePhase>('idle');
  const [revealAngle, setRevealAngle] = React.useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const resetAnimation = useCallback(() => {
    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    setRevealAngle(0);
    setPhase('idle');
  }, []);

  const startAnimation = useCallback(() => {
    if (phase !== 'idle') return;

    setPhase('animating');
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / HANDLE_DRAW_DURATION, 1);

      // Ease-out cubic curve for smooth deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const angle = easedProgress * 360;

      setRevealAngle(angle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setPhase('complete');
        onComplete?.();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [phase, onComplete]);

  // Auto-start when enabled becomes true
  useEffect(() => {
    if (enabled && phase === 'idle') {
      // Small delay to ensure everything is mounted
      const startDelay = setTimeout(() => {
        startAnimation();
      }, 50);
      return () => clearTimeout(startDelay);
    }
  }, [enabled, phase, startAnimation]);

  // Reset when enabled becomes false
  useEffect(() => {
    if (!enabled && phase !== 'idle') {
      resetAnimation();
    }
  }, [enabled, phase, resetAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    phase,
    isAnimating: phase === 'animating',
    isComplete: phase === 'complete',
    revealAngle,
    startAnimation,
    resetAnimation
  };
}

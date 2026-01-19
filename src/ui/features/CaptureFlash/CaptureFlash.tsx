import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useCrannState } from '../../hooks/useLensorState';
import { useSettings } from '../../../settings/useSettings';

const CANVAS_SIZE = 400;
const ANIMATION_DURATION_MS = 400;

// Quick flash overlay that fades out
const flashFade = keyframes`
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
  }
`;

// The ring expands from lens size to cover the viewport
const expandPulse = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.9;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(10);
    opacity: 0;
  }
`;

// Full-screen flash overlay
const FlashOverlay = styled.div<{ $isAnimating: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  opacity: 0;
  
  ${props => props.$isAnimating && css`
    animation: ${flashFade} 200ms ease-out forwards;
  `}
`;

const FlashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 2147483646; /* Just below the lens container */
  overflow: hidden;
`;

interface PulseRingProps {
  $x: number;
  $y: number;
  $isAnimating: boolean;
}

const PulseRing = styled.div<PulseRingProps>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  width: ${CANVAS_SIZE}px;
  height: ${CANVAS_SIZE}px;
  border-radius: 50%;
  pointer-events: none;
  
  /* Bright ring that's visible */
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(255, 255, 255, 0.9) 70%,
    rgba(255, 255, 255, 1) 80%,
    rgba(255, 255, 255, 0.9) 90%,
    rgba(255, 255, 255, 0) 100%
  );
  
  /* Add a glow effect */
  box-shadow: 0 0 60px 20px rgba(255, 255, 255, 0.4);
  
  transform: translate(-50%, -50%) scale(1);
  opacity: 0;
  
  ${props => props.$isAnimating && css`
    animation: ${expandPulse} ${ANIMATION_DURATION_MS}ms ease-out forwards;
  `}
`;

// Secondary inner pulse for depth - bright center flash
const InnerPulse = styled.div<PulseRingProps>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  width: ${CANVAS_SIZE}px;
  height: ${CANVAS_SIZE}px;
  border-radius: 50%;
  pointer-events: none;
  
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.7) 30%,
    rgba(255, 255, 255, 0.3) 60%,
    rgba(255, 255, 255, 0) 80%
  );
  
  transform: translate(-50%, -50%) scale(1);
  opacity: 0;
  
  ${props => props.$isAnimating && css`
    animation: ${expandPulse} ${ANIMATION_DURATION_MS * 0.7}ms ease-out forwards;
  `}
`;

/**
 * CaptureFlash renders a radial pulse animation originating from the lens position
 * when a screenshot capture begins. This provides visual feedback that a capture
 * is happening, making the lens disappear/reappear feel intentional.
 * 
 * Uses `isFlashing` state (separate from `isCapturing`) so the flash can complete
 * before the actual screenshot is taken, avoiding the flash appearing in the capture.
 */
const CaptureFlash: React.FC = () => {
  const [isFlashing] = useCrannState('isFlashing');
  const [lensePosition] = useCrannState('lensePosition');
  const { settings } = useSettings();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [pulsePosition, setPulsePosition] = useState({ x: 0, y: 0 });
  const animationTimeoutRef = useRef<number | null>(null);
  
  // Calculate the center of the lens (position is top-left of canvas)
  const getLensCenter = () => ({
    x: lensePosition.x + CANVAS_SIZE / 2,
    y: lensePosition.y + CANVAS_SIZE / 2
  });
  
  useEffect(() => {
    if (isFlashing) {
      // Flash triggered - start the animation
      const center = getLensCenter();
      setPulsePosition(center);
      setIsAnimating(true);
      
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Stop animation after it completes
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
      }, ANIMATION_DURATION_MS + 50);
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isFlashing, lensePosition]);
  
  // Don't render anything if not animating or flash is disabled in settings
  if (!isAnimating || !settings.flashEffectEnabled) return null;
  
  return (
    <FlashContainer>
      {/* Full-screen flash for immediate impact */}
      <FlashOverlay $isAnimating={isAnimating} />
      {/* Expanding ring from lens center */}
      <PulseRing 
        $x={pulsePosition.x} 
        $y={pulsePosition.y} 
        $isAnimating={isAnimating} 
      />
      {/* Bright center burst */}
      <InnerPulse 
        $x={pulsePosition.x} 
        $y={pulsePosition.y} 
        $isAnimating={isAnimating} 
      />
    </FlashContainer>
  );
};

export default CaptureFlash;


import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';

/**
 * LenseEntranceAnimation - Prototype for dramatic lens entrance effect
 * 
 * Animation sequence:
 * 1. Tracer line appears and draws around the circle (SVG stroke animation)
 * 2. Handle texture is revealed behind the tracer (conic gradient mask)
 * 3. Center content fades in
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CANVAS_SIZE = 400;
const BORDER_SIZE = 60;
const HANDLE_WIDTH = BORDER_SIZE / 2; // 30px visible ring
const TOTAL_SIZE = CANVAS_SIZE + BORDER_SIZE; // 460px

// Animation timing (milliseconds)
const HANDLE_DRAW_DURATION = 1500;
const CENTER_FADE_DURATION = 400;
const CENTER_FADE_DELAY = HANDLE_DRAW_DURATION - 200; // Start slightly before handle finishes

// SVG circle calculations
const SVG_CENTER = TOTAL_SIZE / 2; // 230
const CIRCLE_RADIUS = (TOTAL_SIZE - HANDLE_WIDTH) / 2; // 215
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~1350

// ============================================================================
// KEYFRAMES
// ============================================================================

// Draw the SVG stroke around the circle
const drawStroke = keyframes`
  from {
    stroke-dashoffset: ${CIRCUMFERENCE};
  }
  to {
    stroke-dashoffset: 0;
  }
`;

// Fade in the center content
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Pulse glow on the tracer head
const tracerGlow = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9))
            drop-shadow(0 0 12px rgba(120, 200, 255, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 1))
            drop-shadow(0 0 20px rgba(120, 200, 255, 0.8));
  }
`;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const AnimationContainer = styled.div`
  position: relative;
  width: ${TOTAL_SIZE}px;
  height: ${TOTAL_SIZE}px;
`;

// The SVG tracer that draws around the circle
const TracerSvg = styled.svg<{ $animating: boolean; $duration: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${TOTAL_SIZE}px;
  height: ${TOTAL_SIZE}px;
  z-index: 100;
  pointer-events: none;
  transform: rotate(-90deg); /* Start from top (12 o'clock) */
  
  ${props => props.$animating && css`
    animation: ${tracerGlow} 0.3s ease-in-out infinite;
  `}
`;

const TracerCircle = styled.circle<{ $animating: boolean; $duration: number }>`
  fill: none;
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: ${CIRCUMFERENCE};
  stroke-dashoffset: ${CIRCUMFERENCE};
  
  ${props => props.$animating && css`
    animation: ${drawStroke} ${props.$duration}ms ease-out forwards;
  `}
`;

// The handle ring with conic gradient mask for progressive reveal
const HandleRing = styled.div<{ 
  $animating: boolean; 
  $duration: number;
  $handleColor: string;
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${TOTAL_SIZE}px;
  height: ${TOTAL_SIZE}px;
  border-radius: 50%;
  background: ${props => props.$handleColor};
  z-index: 50;
  
  /* Knurling pattern simulation */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: repeating-conic-gradient(
      from 0deg,
      rgba(0, 0, 0, 0.1) 0deg 2deg,
      rgba(255, 255, 255, 0.05) 2deg 4deg
    );
    opacity: 0.5;
  }

  /* Box shadow for depth */
  box-shadow:
    3px 4px 8px rgba(0, 0, 0, 0.4),
    1px 2px 3px rgba(0, 0, 0, 0.3),
    inset -2px -3px 6px rgba(0, 0, 0, 0.35),
    inset 1px 2px 3px rgba(255, 255, 255, 0.1);

  /* Conic gradient mask for progressive reveal */
  /* Using @property would be ideal but styled-components doesn't support it directly */
  /* So we'll use a CSS variable approach with a wrapper */
  mask: conic-gradient(
    from -90deg at center,
    black 0deg,
    black var(--reveal-angle, 0deg),
    transparent var(--reveal-angle, 0deg),
    transparent 360deg
  );
  -webkit-mask: conic-gradient(
    from -90deg at center,
    black 0deg,
    black var(--reveal-angle, 0deg),
    transparent var(--reveal-angle, 0deg),
    transparent 360deg
  );
`;

// Center content area (simulates the zoomed canvas)
const CenterContent = styled.div<{ 
  $visible: boolean; 
  $duration: number;
  $delay: number;
}>`
  position: absolute;
  top: ${HANDLE_WIDTH}px;
  left: ${HANDLE_WIDTH}px;
  width: ${CANVAS_SIZE}px;
  height: ${CANVAS_SIZE}px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  z-index: 60;
  
  /* Simulate some content */
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  text-align: center;
  
  opacity: 0;
  transform: scale(0.95);
  
  ${props => props.$visible && css`
    animation: ${fadeIn} ${props.$duration}ms ease-out ${props.$delay}ms forwards;
  `}
  
  /* Glass overlay effect */
  box-shadow: inset 0 0 20px 8px rgba(0, 0, 0, 0.25);
`;

// Crosshair in center
const Crosshair = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.5);
  }
  
  &::before {
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    transform: translateY(-50%);
  }
  
  &::after {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    transform: translateX(-50%);
  }
`;

// Control buttons for demo
const Controls = styled.div`
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #3a86ff;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #2667cc;
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const ColorPicker = styled.input`
  width: 40px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
`;

// ============================================================================
// COMPONENT
// ============================================================================

type AnimationPhase = 'idle' | 'drawing' | 'content' | 'complete';

interface LenseEntranceAnimationProps {
  onComplete?: () => void;
  autoStart?: boolean;
  handleColor?: string;
}

const LenseEntranceAnimation: React.FC<LenseEntranceAnimationProps> = ({
  onComplete,
  autoStart = false,
  handleColor: initialHandleColor = '#6b7280'
}) => {
  const [phase, setPhase] = useState<AnimationPhase>(autoStart ? 'drawing' : 'idle');
  const [handleColor, setHandleColor] = useState(initialHandleColor);
  const [revealAngle, setRevealAngle] = useState(0);
  const handleRef = React.useRef<HTMLDivElement>(null);

  // Animate the reveal angle using requestAnimationFrame for smooth conic gradient
  useEffect(() => {
    if (phase !== 'drawing') return;

    const startTime = performance.now();
    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / HANDLE_DRAW_DURATION, 1);
      
      // Ease-out curve
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const angle = easedProgress * 360;
      
      setRevealAngle(angle);
      
      if (handleRef.current) {
        handleRef.current.style.setProperty('--reveal-angle', `${angle}deg`);
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Handle animation complete, start content fade
        setPhase('content');
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [phase]);

  // Handle content phase completion
  useEffect(() => {
    if (phase !== 'content') return;

    const timer = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, CENTER_FADE_DURATION);

    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const startAnimation = useCallback(() => {
    setRevealAngle(0);
    if (handleRef.current) {
      handleRef.current.style.setProperty('--reveal-angle', '0deg');
    }
    setPhase('drawing');
  }, []);

  const resetAnimation = useCallback(() => {
    setRevealAngle(0);
    if (handleRef.current) {
      handleRef.current.style.setProperty('--reveal-angle', '0deg');
    }
    setPhase('idle');
  }, []);

  const isDrawing = phase === 'drawing';
  const showContent = phase === 'content' || phase === 'complete';

  return (
    <AnimationContainer>
      {/* Handle ring with conic mask reveal */}
      <HandleRing 
        ref={handleRef}
        $animating={isDrawing}
        $duration={HANDLE_DRAW_DURATION}
        $handleColor={handleColor}
      />

      {/* SVG tracer line */}
      <TracerSvg 
        $animating={isDrawing}
        $duration={HANDLE_DRAW_DURATION}
        viewBox={`0 0 ${TOTAL_SIZE} ${TOTAL_SIZE}`}
      >
        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* The tracer circle */}
        <TracerCircle
          cx={SVG_CENTER}
          cy={SVG_CENTER}
          r={CIRCLE_RADIUS}
          $animating={isDrawing}
          $duration={HANDLE_DRAW_DURATION}
          filter="url(#glow)"
        />
      </TracerSvg>

      {/* Center content */}
      <CenterContent 
        $visible={showContent}
        $duration={CENTER_FADE_DURATION}
        $delay={0}
      >
        <div>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
          <div>Zoomed Content</div>
          <div style={{ opacity: 0.6, fontSize: '12px', marginTop: '4px' }}>
            {CANVAS_SIZE}×{CANVAS_SIZE}px
          </div>
        </div>
        <Crosshair />
      </CenterContent>

      {/* Demo controls */}
      <Controls>
        <Button 
          onClick={startAnimation}
          disabled={isDrawing}
        >
          {phase === 'idle' ? 'Play Animation' : 'Replay'}
        </Button>
        <Button onClick={resetAnimation}>
          Reset
        </Button>
        <ColorPicker 
          type="color" 
          value={handleColor}
          onChange={(e) => setHandleColor(e.target.value)}
          title="Handle Color"
        />
      </Controls>
    </AnimationContainer>
  );
};

export default LenseEntranceAnimation;

// ============================================================================
// DEMO WRAPPER (for standalone testing)
// ============================================================================

export const LenseEntranceDemo: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '80px',
      }}>
        <h1 style={{ 
          color: 'white', 
          margin: 0,
          fontSize: '24px',
          fontWeight: 500,
        }}>
          Lense Entrance Animation Prototype
        </h1>
        <LenseEntranceAnimation />
        <p style={{ 
          color: 'rgba(255,255,255,0.5)', 
          margin: 0,
          fontSize: '14px',
          maxWidth: '400px',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Click "Play Animation" to see the effect. The tracer line draws around 
          the circle while the handle texture is revealed behind it, then the 
          center content fades in.
        </p>
      </div>
    </div>
  );
};


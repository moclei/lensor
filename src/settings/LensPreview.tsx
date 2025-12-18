import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import Handle from '@/ui/features/Lense/Handle';
import { LensorSettings } from './types';
import {
  generateMaterialPalette,
  getSubtleTextureColor,
  hexToRgba,
  convertToGrayscalePreservingFormat
} from '@/ui/utils/color-utils';
import FisheyeGl, { Fisheye } from '@/lib/fisheyegl';

// ============ Constants ============

const PREVIEW_CANVAS_SIZE = 200;
const PREVIEW_BORDER_SIZE = 30;
const SOURCE_SIZE = 400; // Size of the source content canvas

// Sample colors to cycle through
const SAMPLE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

// ============ Styled Components ============

const PreviewContainer = styled.div`
  background: linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const PreviewTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #71717a;
  margin: 0;
  align-self: flex-start;
`;

const LensWrapper = styled.div`
  position: relative;
  width: ${PREVIEW_CANVAS_SIZE + PREVIEW_BORDER_SIZE}px;
  height: ${PREVIEW_CANVAS_SIZE + PREVIEW_BORDER_SIZE}px;
`;

// The main visible lens canvas
const LensCanvas = styled.canvas`
  position: absolute;
  top: ${PREVIEW_BORDER_SIZE / 2}px;
  left: ${PREVIEW_BORDER_SIZE / 2}px;
  width: ${PREVIEW_CANVAS_SIZE}px;
  height: ${PREVIEW_CANVAS_SIZE}px;
  border-radius: 50%;
`;

// Hidden canvases for rendering pipeline
const HiddenCanvas = styled.canvas`
  display: none;
`;

// Grid overlay
const GridOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: ${PREVIEW_BORDER_SIZE / 2}px;
  left: ${PREVIEW_BORDER_SIZE / 2}px;
  width: ${PREVIEW_CANVAS_SIZE}px;
  height: ${PREVIEW_CANVAS_SIZE}px;
  border-radius: 50%;
  pointer-events: none;
  opacity: ${(props) => (props.$visible ? 0.4 : 0)};
  transition: opacity 0.2s ease;
  background-image: linear-gradient(rgba(0, 0, 0, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.4) 1px, transparent 1px);
  background-size: 16px 16px;
`;

// Glass overlay effect
const GlassOverlay = styled.div`
  position: absolute;
  top: ${PREVIEW_BORDER_SIZE / 2}px;
  left: ${PREVIEW_BORDER_SIZE / 2}px;
  width: ${PREVIEW_CANVAS_SIZE}px;
  height: ${PREVIEW_CANVAS_SIZE}px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    transparent 60%,
    rgba(0, 0, 0, 0.05) 75%,
    rgba(0, 0, 0, 0.12) 90%,
    rgba(0, 0, 0, 0.2) 100%
  );
  box-shadow: inset 0 0 12px 4px rgba(0, 0, 0, 0.12);
`;

// Crosshairs
const Crosshairs = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  pointer-events: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(0, 0, 0, 0.5);
  }

  &::before {
    width: 100%;
    height: 2px;
    top: 50%;
    transform: translateY(-50%);
  }

  &::after {
    width: 2px;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
`;

// Color picker row
const ColorPickerRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ColorButton = styled.button<{ $color: string; $active: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${(props) => props.$color};
  border: 2px solid
    ${(props) => (props.$active ? 'white' : 'rgba(255, 255, 255, 0.2)')};
  cursor: pointer;
  transition: all 0.15s ease;
  transform: ${(props) => (props.$active ? 'scale(1.1)' : 'scale(1)')};

  &:hover {
    transform: scale(1.15);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const PreviewLabel = styled.span`
  font-size: 11px;
  color: #52525b;
  text-align: center;
`;

const SettingsIndicator = styled.div`
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #71717a;
`;

const Indicator = styled.span<{ $active: boolean }>`
  color: ${(props) => (props.$active ? '#10b981' : '#52525b')};
`;

// Animation
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

const AnimatedWrapper = styled.div<{ $animate: boolean; $key: number }>`
  animation: ${(props) => (props.$animate ? fadeIn : 'none')} 0.3s ease-out;
`;

// ============ Helper: Draw fake website to canvas ============

function drawFakeWebsite(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const padding = 24;
  let y = padding;

  // Header bar
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(padding, y, width - padding * 2, 40, 8);
  ctx.fill();

  // Logo in header
  const logoGradient = ctx.createLinearGradient(padding + 12, y + 10, padding + 32, y + 30);
  logoGradient.addColorStop(0, '#3b82f6');
  logoGradient.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = logoGradient;
  ctx.beginPath();
  ctx.roundRect(padding + 12, y + 10, 20, 20, 4);
  ctx.fill();

  // Nav items
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.roundRect(padding + 50 + i * 45, y + 16, 35, 8, 2);
    ctx.fill();
  }

  y += 55;

  // Hero section
  const heroGradient = ctx.createLinearGradient(padding, y, width - padding, y + 100);
  heroGradient.addColorStop(0, '#6366f1');
  heroGradient.addColorStop(0.5, '#8b5cf6');
  heroGradient.addColorStop(1, '#a855f7');
  ctx.fillStyle = heroGradient;
  ctx.beginPath();
  ctx.roundRect(padding, y, width - padding * 2, 100, 12);
  ctx.fill();

  // Hero title
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(padding + 20, y + 20, 200, 16, 4);
  ctx.fill();

  // Hero subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.roundRect(padding + 20, y + 45, 150, 10, 3);
  ctx.fill();

  // Hero buttons
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(padding + 20, y + 70, 60, 20, 5);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.roundRect(padding + 90, y + 70, 60, 20, 5);
  ctx.fill();

  y += 120;

  // Cards
  const cardColors = ['#22c55e', '#f59e0b', '#ec4899'];
  const cardBgColors = ['#f0fdf4', '#fef3c7', '#fce7f3'];
  const cardWidth = (width - padding * 2 - 20) / 3;

  for (let i = 0; i < 3; i++) {
    const cardX = padding + i * (cardWidth + 10);

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, y, cardWidth, 80, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Card image
    ctx.fillStyle = cardColors[i];
    ctx.beginPath();
    ctx.roundRect(cardX + 10, y + 10, cardWidth - 20, 35, 5);
    ctx.fill();

    // Card text
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(cardX + 10, y + 55, cardWidth - 30, 8, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cardX + 10, y + 68, cardWidth - 50, 6, 2);
    ctx.fill();
  }

  y += 100;

  // Footer icons
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(width / 2 - 50 + i * 35, y + 20, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============ Component ============

interface LensPreviewProps {
  settings: LensorSettings;
}

export const LensPreview: React.FC<LensPreviewProps> = ({ settings }) => {
  const [selectedColor, setSelectedColor] = useState(SAMPLE_COLORS[0]);
  const [animationKey, setAnimationKey] = useState(0);

  // Canvas refs
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const fisheyeCanvasRef = useRef<HTMLCanvasElement>(null);
  const fisheyeRef = useRef<Fisheye | null>(null);

  // Generate palettes from selected color
  const materialPalette = generateMaterialPalette(selectedColor);
  const textureColors = getSubtleTextureColor(selectedColor, 5, 25);

  // Draw the lens content
  const drawLens = useCallback(() => {
    const lensCanvas = lensCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    const fisheyeCanvas = fisheyeCanvasRef.current;

    if (!lensCanvas || !sourceCanvas) return;

    const lensCtx = lensCanvas.getContext('2d');
    const sourceCtx = sourceCanvas.getContext('2d');

    if (!lensCtx || !sourceCtx) return;

    // Draw fake website to source canvas
    drawFakeWebsite(sourceCtx, SOURCE_SIZE, SOURCE_SIZE);

    // Calculate zoom crop
    const zoom = settings.defaultZoom;
    const sourceSize = SOURCE_SIZE / zoom;
    const sourceX = (SOURCE_SIZE - sourceSize) / 2;
    const sourceY = (SOURCE_SIZE - sourceSize) / 2;

    if (settings.defaultFisheye && fisheyeCanvas) {
      // Initialize fisheye if needed
      if (!fisheyeRef.current) {
        try {
          fisheyeRef.current = FisheyeGl({
            canvas: fisheyeCanvas,
            lens: {
              a: 1,
              b: 1,
              Fx: -0.15,
              Fy: -0.15,
              scale: 1.05
            },
            fov: {
              x: 1,
              y: 1
            }
          });
        } catch (e) {
          console.warn('WebGL not available for fisheye preview');
        }
      }

      if (fisheyeRef.current) {
        // Draw zoomed content to a temp canvas first
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = PREVIEW_CANVAS_SIZE;
        tempCanvas.height = PREVIEW_CANVAS_SIZE;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(
            sourceCanvas,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            PREVIEW_CANVAS_SIZE,
            PREVIEW_CANVAS_SIZE
          );

          // Apply fisheye
          fisheyeRef.current.setCanvasSource(tempCanvas);
          lensCtx.drawImage(fisheyeRef.current.getCanvas(), 0, 0, PREVIEW_CANVAS_SIZE, PREVIEW_CANVAS_SIZE);
        }
      }
    } else {
      // Direct draw without fisheye
      lensCtx.drawImage(
        sourceCanvas,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        PREVIEW_CANVAS_SIZE,
        PREVIEW_CANVAS_SIZE
      );
    }
  }, [settings.defaultZoom, settings.defaultFisheye]);

  // Redraw when settings change
  useEffect(() => {
    drawLens();
  }, [drawLens, settings.defaultZoom, settings.defaultFisheye]);

  // Trigger animation when clicking a color (if animations enabled)
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    if (settings.animationsEnabled) {
      setAnimationKey((k) => k + 1);
    }
  };

  return (
    <PreviewContainer>
      <PreviewTitle>Live Preview</PreviewTitle>

      {/* Hidden canvases for rendering */}
      <HiddenCanvas
        ref={sourceCanvasRef}
        width={SOURCE_SIZE}
        height={SOURCE_SIZE}
      />
      <HiddenCanvas
        ref={fisheyeCanvasRef}
        width={PREVIEW_CANVAS_SIZE}
        height={PREVIEW_CANVAS_SIZE}
      />

      <AnimatedWrapper
        $animate={settings.animationsEnabled}
        $key={animationKey}
      >
        <LensWrapper>
          {/* Handle ring - override position to 0,0 */}
          <Handle
            canvasSize={PREVIEW_CANVAS_SIZE}
            borderSize={PREVIEW_BORDER_SIZE}
            visible={true}
            contrastColor={hexToRgba(
              convertToGrayscalePreservingFormat(
                materialPalette?.[800] || '#000000'
              ),
              1
            )}
            contrastColor2={materialPalette?.[300] || selectedColor}
            hoveredColor={selectedColor}
            textureHighlight={textureColors.highlight}
            textureHighlightBright={textureColors.highlightBright}
            textureHighlightBrightest={textureColors.highlightBrightest}
            textureShadow={textureColors.shadow}
            patternName="knurling"
            patternOpacity={settings.handleTextureEnabled ? 0.25 : 0}
            style={{
              opacity: settings.handleOpacity / 100,
              top: 0,
              left: 0,
              transition: settings.animationsEnabled
                ? 'opacity 0.2s ease'
                : 'none'
            }}
          />

          {/* Main lens canvas */}
          <LensCanvas
            ref={lensCanvasRef}
            width={PREVIEW_CANVAS_SIZE}
            height={PREVIEW_CANVAS_SIZE}
          />

          {/* Grid overlay */}
          <GridOverlay $visible={settings.defaultGrid} />

          {/* Glass effect */}
          <GlassOverlay />

          {/* Crosshairs */}
          <Crosshairs />
        </LensWrapper>
      </AnimatedWrapper>

      {/* Current settings indicator */}
      <SettingsIndicator>
        <Indicator $active={settings.defaultGrid}>
          Grid: {settings.defaultGrid ? 'On' : 'Off'}
        </Indicator>
        <Indicator $active={settings.defaultFisheye}>
          Fisheye: {settings.defaultFisheye ? 'On' : 'Off'}
        </Indicator>
        <span>Zoom: {settings.defaultZoom}×</span>
      </SettingsIndicator>

      <PreviewLabel>Preview handle theming</PreviewLabel>

      <ColorPickerRow>
        {SAMPLE_COLORS.map((color) => (
          <ColorButton
            key={color}
            $color={color}
            $active={color === selectedColor}
            onClick={() => handleColorSelect(color)}
            title={color}
          />
        ))}
      </ColorPickerRow>
    </PreviewContainer>
  );
};

export default LensPreview;

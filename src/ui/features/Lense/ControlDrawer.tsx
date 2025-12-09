import React, { useState, useCallback } from 'react';
import {
  DrawerContainer,
  PullTab,
  DrawerPanel,
  DrawerContent,
  ControlsRow,
  ToggleButton,
  ZoomControl,
  ZoomButton,
  ZoomLevel,
  PaletteSection,
  PaletteLabel,
  SwatchRow,
  ColorSwatch,
  CopyTooltip,
  CurrentColorBadge
} from './ControlDrawer.styles';
import { parseRgbColor, rgbToHex } from '@/ui/utils/color-utils';

// Helper to convert rgb string to hex
function rgbStringToHex(rgbStr: string): string {
  if (rgbStr.startsWith('#')) return rgbStr;
  const rgb = parseRgbColor(rgbStr);
  if (!rgb) return '#000000';
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

interface ControlDrawerProps {
  canvasSize: number;
  accentColor: string;
  // State values
  gridOn: boolean;
  fisheyeOn: boolean;
  zoom: number;
  hoveredColor: string;
  colorPalette: string[];
  materialPalette: Record<number, string>;
  // State setters
  onGridToggle: () => void;
  onFisheyeToggle: () => void;
  onZoomChange: (newZoom: number) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 16;

export const ControlDrawer: React.FC<ControlDrawerProps> = ({
  canvasSize,
  accentColor,
  gridOn,
  fisheyeOn,
  zoom,
  hoveredColor,
  colorPalette,
  materialPalette,
  onGridToggle,
  onFisheyeToggle,
  onZoomChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (zoom < MAX_ZOOM) {
      onZoomChange(zoom + 1);
    }
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    if (zoom > MIN_ZOOM) {
      onZoomChange(zoom - 1);
    }
  }, [zoom, onZoomChange]);

  const copyToClipboard = useCallback(async (color: string) => {
    try {
      // Convert rgb to hex if needed
      const hexColor = rgbStringToHex(color);
      await navigator.clipboard.writeText(hexColor.toUpperCase());
      setCopyTooltip(hexColor.toUpperCase());
      setTimeout(() => setCopyTooltip(null), 1500);
    } catch (err) {
      console.error('Failed to copy color:', err);
    }
  }, []);

  // Convert hovered color to hex for display
  const hexColor = rgbStringToHex(hoveredColor);

  // Get material palette as sorted array
  const materialColors = Object.entries(materialPalette)
    .map(([weight, color]) => ({ weight: parseInt(weight), color }))
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 6); // Show max 6 swatches

  return (
    <DrawerContainer canvasSize={canvasSize}>
      {/* Current color badge - always visible */}
      <CurrentColorBadge
        color={accentColor}
        onClick={() => copyToClipboard(hoveredColor)}
        title="Click to copy"
      >
        {hexColor.toUpperCase()}
      </CurrentColorBadge>

      {/* Pull tab */}
      <PullTab
        accentColor={accentColor}
        isOpen={isOpen}
        onClick={handleToggle}
        title={isOpen ? 'Close controls' : 'Open controls'}
      />

      {/* Drawer panel */}
      <DrawerPanel isOpen={isOpen} accentColor={accentColor}>
        <DrawerContent>
          {/* Toggle controls row */}
          <ControlsRow>
            <ToggleButton
              isActive={gridOn}
              accentColor={accentColor}
              onClick={onGridToggle}
              title="Toggle grid overlay"
            >
              ⊞
            </ToggleButton>

            <ToggleButton
              isActive={fisheyeOn}
              accentColor={accentColor}
              onClick={onFisheyeToggle}
              title="Toggle fisheye effect"
            >
              ◉
            </ToggleButton>

            <ZoomControl>
              <ZoomButton onClick={handleZoomOut} title="Zoom out">
                −
              </ZoomButton>
              <ZoomLevel>{zoom}×</ZoomLevel>
              <ZoomButton onClick={handleZoomIn} title="Zoom in">
                +
              </ZoomButton>
            </ZoomControl>
          </ControlsRow>

          {/* Color harmony palette */}
          {colorPalette.length > 0 && (
            <PaletteSection>
              <PaletteLabel>Color Harmony</PaletteLabel>
              <SwatchRow>
                {colorPalette.slice(0, 5).map((color, index) => (
                  <ColorSwatch
                    key={`harmony-${index}`}
                    color={color}
                    isMain={index === 0}
                    onClick={() => copyToClipboard(color)}
                    title={`Click to copy ${color}`}
                  />
                ))}
              </SwatchRow>
            </PaletteSection>
          )}

          {/* Material tones palette */}
          {materialColors.length > 0 && (
            <PaletteSection>
              <PaletteLabel>Material Tones</PaletteLabel>
              <SwatchRow>
                {materialColors.map(({ weight, color }) => (
                  <ColorSwatch
                    key={`material-${weight}`}
                    color={color}
                    onClick={() => copyToClipboard(color)}
                    title={`${weight} - Click to copy`}
                  />
                ))}
              </SwatchRow>
            </PaletteSection>
          )}
        </DrawerContent>
      </DrawerPanel>

      {/* Copy tooltip */}
      {copyTooltip && (
        <CopyTooltip visible={!!copyTooltip}>
          Copied {copyTooltip}
        </CopyTooltip>
      )}
    </DrawerContainer>
  );
};

export default ControlDrawer;


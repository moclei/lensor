import React, { useState, useCallback, useMemo } from 'react';
import { useCrannActions } from '@/ui/hooks/useLensorState';
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
  CurrentColorSection,
  CurrentColorSwatch,
  CurrentColorHex,
  CurrentColorLabel,
  CurrentColorInfo,
  SettingsButton,
  SaveColorButton,
  DrawerPosition
} from './ControlDrawer.styles';
import {
  parseRgbColor,
  rgbToHex,
  rgbToHsl,
  generateAnyPalette,
  getPaletteDisplayName
} from '@/ui/utils/color-utils';
import { useSettings } from '../../../settings/useSettings';
import { ColorCopyFormat, PaletteType } from '../../../settings/types';
import { useSavedColors, colorToHex } from '../../../settings/savedColors';

// Re-export the type for consumers
export type { DrawerPosition };

// Helper to convert rgb string to hex
function rgbStringToHex(rgbStr: string): string {
  if (rgbStr.startsWith('#')) return rgbStr;
  const rgb = parseRgbColor(rgbStr);
  if (!rgb) return '#000000';
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

// Helper to format color based on user preference
function formatColor(rgbStr: string, format: ColorCopyFormat): string {
  // Parse the rgb string
  let r = 0,
    g = 0,
    b = 0;

  if (rgbStr.startsWith('#')) {
    const hex = rgbStr.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const rgb = parseRgbColor(rgbStr);
    if (rgb) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }
  }

  switch (format) {
    case 'hex':
      return rgbToHex(r, g, b).toUpperCase();
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
    case 'hsl': {
      const [h, s, l] = rgbToHsl(r, g, b);
      return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    default:
      return rgbToHex(r, g, b).toUpperCase();
  }
}

interface ControlDrawerProps {
  canvasSize: number;
  accentColor: string;
  position?: DrawerPosition;
  visible: boolean;
  style?: React.CSSProperties;
  // State values
  isOpen: boolean;
  gridOn: boolean;
  fisheyeOn: boolean;
  zoom: number;
  hoveredColor: string;
  // Callbacks
  onToggle: () => void;
  onGridToggle: () => void;
  onFisheyeToggle: () => void;
  onManualRefresh: () => void;
  onZoomChange: (newZoom: number) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 16;

export const ControlDrawer: React.FC<ControlDrawerProps> = ({
  canvasSize,
  accentColor,
  position = 'bottom',
  visible,
  style,
  isOpen,
  gridOn,
  fisheyeOn,
  zoom,
  hoveredColor,
  onToggle,
  onGridToggle,
  onFisheyeToggle,
  onManualRefresh,
  onZoomChange
}) => {
  const [copyTooltip, setCopyTooltip] = useState<string | null>(null);
  const [saveTooltip, setSaveTooltip] = useState<string | null>(null);
  const { settings } = useSettings();
  const { savedColors, saveColor } = useSavedColors();

  // Check if current color is already saved
  const isColorSaved = savedColors.some(
    (c) => colorToHex(c.color) === colorToHex(hoveredColor)
  );

  // Generate palettes based on settings (with fallback to defaults)
  const displayPalettes = useMemo(() => {
    const palettesToShow =
      settings.drawerPalettes?.length > 0
        ? settings.drawerPalettes
        : (['monochromatic', 'material'] as PaletteType[]);

    return palettesToShow.map((paletteType: PaletteType) => ({
      type: paletteType,
      name: getPaletteDisplayName(paletteType),
      colors: generateAnyPalette(hoveredColor, paletteType)
    }));
  }, [hoveredColor, settings.drawerPalettes]);

  const handleSaveColor = useCallback(() => {
    if (isColorSaved) {
      setSaveTooltip('Already saved');
    } else {
      saveColor(hoveredColor);
      setSaveTooltip('Saved!');
    }
    setTimeout(() => setSaveTooltip(null), 1500);
  }, [hoveredColor, isColorSaved, saveColor]);

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

  const copyToClipboard = useCallback(
    async (color: string) => {
      try {
        // Format color based on user preference
        const formattedColor = formatColor(color, settings.colorCopyFormat);
        await navigator.clipboard.writeText(formattedColor);
        setCopyTooltip(formattedColor);
        setTimeout(() => setCopyTooltip(null), 1500);
      } catch (err) {
        console.error('Failed to copy color:', err);
      }
    },
    [settings.colorCopyFormat]
  );

  // Get the openSettings action from Crann
  const { openSettings } = useCrannActions();

  // Convert hovered color to hex for display
  const hexColor = rgbStringToHex(hoveredColor);

  return (
    <DrawerContainer
      canvasSize={canvasSize}
      position={position}
      visible={visible}
      style={style}
    >
      {/* Pull tab */}
      <PullTab
        accentColor={accentColor}
        isOpen={isOpen}
        position={position}
        onClick={onToggle}
        title={isOpen ? 'Close controls' : 'Open controls'}
      />

      {/* Drawer panel */}
      <DrawerPanel
        isOpen={isOpen}
        accentColor={accentColor}
        position={position}
      >
        <DrawerContent>
          {/* Current color display */}
          <CurrentColorSection>
            <CurrentColorSwatch
              color={hoveredColor}
              onClick={() => copyToClipboard(hoveredColor)}
              title="Click to copy"
            />
            <CurrentColorInfo>
              <CurrentColorLabel>Current Color</CurrentColorLabel>
              <CurrentColorHex color={hoveredColor}>
                {hexColor.toUpperCase()}
              </CurrentColorHex>
            </CurrentColorInfo>
            <SaveColorButton
              onClick={handleSaveColor}
              $saved={isColorSaved}
              title={isColorSaved ? 'Color saved' : 'Save color'}
            >
              {isColorSaved ? '♥' : '♡'}
            </SaveColorButton>
            <SettingsButton
              onClick={() => openSettings()}
              title="Open settings"
            >
              ⚙
            </SettingsButton>
          </CurrentColorSection>

          {/* Toggle controls row */}
          <ControlsRow>
            <ToggleButton
              isActive={gridOn}
              onClick={onGridToggle}
              title="Toggle grid overlay"
            >
              ⊞
            </ToggleButton>

            <ToggleButton
              isActive={fisheyeOn}
              onClick={onFisheyeToggle}
              title="Toggle fisheye effect"
            >
              ◉
            </ToggleButton>

            <ToggleButton
              isActive={false}
              onClick={onManualRefresh}
              title="Refresh capture"
            >
              ↻
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

          {/* Dynamic palettes based on settings */}
          {displayPalettes.map((palette, paletteIndex) => (
            <PaletteSection key={palette.type}>
              <PaletteLabel>{palette.name}</PaletteLabel>
              <SwatchRow>
                {palette.colors.slice(0, 6).map((color, index) => (
                  <ColorSwatch
                    key={`${palette.type}-${index}`}
                    color={color}
                    isMain={paletteIndex === 0 && index === 0}
                    onClick={() => copyToClipboard(color)}
                    title={`Click to copy ${color}`}
                  />
                ))}
              </SwatchRow>
            </PaletteSection>
          ))}
        </DrawerContent>
      </DrawerPanel>

      {/* Copy tooltip */}
      {copyTooltip && (
        <CopyTooltip visible={!!copyTooltip}>Copied {copyTooltip}</CopyTooltip>
      )}

      {/* Save tooltip */}
      {saveTooltip && (
        <CopyTooltip visible={!!saveTooltip}>{saveTooltip}</CopyTooltip>
      )}
    </DrawerContainer>
  );
};

export default ControlDrawer;

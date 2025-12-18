import styled, { css, keyframes } from 'styled-components';

// Position type for drawer placement
export type DrawerPosition = 'bottom' | 'right' | 'left' | 'top';

// Animation for drawer expand/collapse
const slideDown = keyframes`
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 300px;
    opacity: 1;
  }
`;

// Helper to determine if a color is light (for contrast calculations)
const isLightColor = (color: string): boolean => {
  // Parse hex or rgb
  let r = 0,
    g = 0,
    b = 0;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  // Relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

// Helper to get container positioning based on drawer position
const getContainerPositioning = (
  position: DrawerPosition,
  canvasSize: number
) => {
  switch (position) {
    case 'bottom':
      return css`
        top: ${canvasSize}px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: column;
        align-items: center;
      `;
    case 'top':
      return css`
        bottom: ${canvasSize}px;
        left: 50%;
        transform: translateX(-50%);
        flex-direction: column-reverse;
        align-items: center;
      `;
    case 'right':
      return css`
        top: 50%;
        left: ${canvasSize}px;
        transform: translateY(-50%);
        flex-direction: row;
        align-items: center;
      `;
    case 'left':
      return css`
        top: 50%;
        right: ${canvasSize}px;
        transform: translateY(-50%);
        flex-direction: row-reverse;
        align-items: center;
      `;
  }
};

// Container that positions the drawer system relative to the lens
export const DrawerContainer = styled.div<{
  canvasSize: number;
  position: DrawerPosition;
  visible: boolean;
}>`
  position: absolute;
  display: flex;
  z-index: 20;
  pointer-events: none;
  ${(props) => getContainerPositioning(props.position, props.canvasSize)}
  
  /* Visibility controlled via opacity for animation capability */
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transition: opacity 0.2s ease-out;
`;

// Helper to get pull tab arrow based on position and open state
const getPullTabArrow = (position: DrawerPosition, isOpen: boolean): string => {
  switch (position) {
    case 'bottom':
      return isOpen ? '▲' : '▼';
    case 'top':
      return isOpen ? '▼' : '▲';
    case 'right':
      return isOpen ? '◀' : '▶';
    case 'left':
      return isOpen ? '▶' : '◀';
  }
};

// Helper to get pull tab styles based on position
const getPullTabStyles = (position: DrawerPosition) => {
  switch (position) {
    case 'bottom':
      return css`
        width: 52px;
        height: 26px;
        border-radius: 0 0 14px 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        &:hover {
          height: 32px;
        }
      `;
    case 'top':
      return css`
        width: 52px;
        height: 26px;
        border-radius: 14px 14px 0 0;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
        &:hover {
          height: 32px;
        }
      `;
    case 'right':
      return css`
        width: 26px;
        height: 52px;
        border-radius: 0 14px 14px 0;
        box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);
        &:hover {
          width: 32px;
        }
      `;
    case 'left':
      return css`
        width: 26px;
        height: 52px;
        border-radius: 14px 0 0 14px;
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
        &:hover {
          width: 32px;
        }
      `;
  }
};

// The pull tab button
export const PullTab = styled.button<{
  accentColor: string;
  isOpen: boolean;
  position: DrawerPosition;
}>`
  background: ${(props) => props.accentColor};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  pointer-events: auto;
  ${(props) => getPullTabStyles(props.position)}

  &::after {
    content: '${(props) => getPullTabArrow(props.position, props.isOpen)}';
    color: ${(props) =>
      isLightColor(props.accentColor)
        ? 'rgba(0, 0, 0, 0.8)'
        : 'rgba(255, 255, 255, 0.9)'};
    font-size: 10px;
    transition: transform 0.3s ease;
  }

  &:focus {
    outline: none;
  }
`;

// Helper to get drawer panel styles based on position
const getDrawerPanelStyles = (
  position: DrawerPosition,
  isOpen: boolean,
  accentColor: string
) => {
  const baseStyles = css`
    background: rgba(20, 20, 30, 0.95);
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    opacity: ${isOpen ? '1' : '0'};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: ${isOpen ? 'auto' : 'none'};
  `;

  switch (position) {
    case 'bottom':
      return css`
        ${baseStyles}
        width: 260px;
        border-radius: 0 0 20px 20px;
        border-top: 2px solid ${accentColor};
        max-height: ${isOpen ? '300px' : '0'};
      `;
    case 'top':
      return css`
        ${baseStyles}
        width: 260px;
        border-radius: 20px 20px 0 0;
        border-bottom: 2px solid ${accentColor};
        max-height: ${isOpen ? '300px' : '0'};
      `;
    case 'right':
      return css`
        ${baseStyles}
        height: auto;
        max-height: 300px;
        border-radius: 0 20px 20px 0;
        border-left: 2px solid ${accentColor};
        max-width: ${isOpen ? '260px' : '0'};
        width: ${isOpen ? '260px' : '0'};
      `;
    case 'left':
      return css`
        ${baseStyles}
        height: auto;
        max-height: 300px;
        border-radius: 20px 0 0 20px;
        border-right: 2px solid ${accentColor};
        max-width: ${isOpen ? '260px' : '0'};
        width: ${isOpen ? '260px' : '0'};
      `;
  }
};

// The expandable drawer panel
export const DrawerPanel = styled.div<{
  isOpen: boolean;
  accentColor: string;
  position: DrawerPosition;
}>`
  ${(props) =>
    getDrawerPanelStyles(props.position, props.isOpen, props.accentColor)}
`;

export const DrawerContent = styled.div`
  padding: 16px;
`;

// Controls row with toggles and zoom
export const ControlsRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

// Static accent color for toggle buttons (distinct from dynamic hovered pixel color)
const TOGGLE_ACTIVE_COLOR = '#0ea5e9';

// Toggle button for grid/fisheye
export const ToggleButton = styled.button<{
  isActive: boolean;
}>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid
    ${(props) =>
      props.isActive ? TOGGLE_ACTIVE_COLOR : 'rgba(255, 255, 255, 0.2)'};
  background: ${(props) =>
    props.isActive ? TOGGLE_ACTIVE_COLOR : 'rgba(255, 255, 255, 0.05)'};
  color: ${(props) => (props.isActive ? 'white' : 'rgba(255, 255, 255, 0.6)')};
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.isActive ? '#0284c7' : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${(props) =>
      props.isActive ? '#0284c7' : 'rgba(255, 255, 255, 0.3)'};
    color: white;
  }

  &:focus {
    outline: none;
  }
`;

// Zoom control container
export const ZoomControl = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;

export const ZoomButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }
`;

export const ZoomLevel = styled.span`
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 600;
  min-width: 32px;
  text-align: center;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// Palette section
export const PaletteSection = styled.div`
  margin-top: 14px;
`;

export const PaletteLabel = styled.div`
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const SwatchRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const ColorSwatch = styled.button<{
  color: string;
  isMain?: boolean;
}>`
  width: ${(props) => (props.isMain ? '40px' : '32px')};
  height: ${(props) => (props.isMain ? '40px' : '32px')};
  border-radius: 6px;
  border: ${(props) => (props.isMain ? '2px' : '1px')} solid
    rgba(255, 255, 255, 0.2);
  background: ${(props) => props.color};
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    transform: scale(1.1);
    border-color: white;
    z-index: 1;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }
`;

// Copy feedback tooltip
export const CopyTooltip = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  pointer-events: none;
  margin-bottom: 4px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// Current color section at the top of the drawer
export const CurrentColorSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

// Large swatch showing the current detected color
export const CurrentColorSwatch = styled.button<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: ${(props) => props.color};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
    border-color: white;
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }
`;

// Hex value display next to the swatch
export const CurrentColorHex = styled.span<{ color: string }>`
  font-size: 14px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
`;

export const CurrentColorLabel = styled.div`
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 2px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

export const CurrentColorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

// Small icon button base style
const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.8);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: none;
  }
`;

// Settings button in the drawer header
export const SettingsButton = styled(IconButton)`
  margin-left: auto;
`;

// Save color button
export const SaveColorButton = styled(IconButton)<{ $saved?: boolean }>`
  color: ${(props) =>
    props.$saved ? '#f472b6' : 'rgba(255, 255, 255, 0.5)'};
  border-color: ${(props) =>
    props.$saved ? 'rgba(244, 114, 182, 0.4)' : 'rgba(255, 255, 255, 0.15)'};
  
  &:hover {
    color: #f472b6;
    border-color: rgba(244, 114, 182, 0.5);
    background: rgba(244, 114, 182, 0.1);
  }
`;

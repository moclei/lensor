import styled, { css, keyframes } from 'styled-components';

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

// Container that positions the drawer system below the lens
export const DrawerContainer = styled.div<{ canvasSize: number }>`
  position: absolute;
  top: ${(props) => props.canvasSize - 20}px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 20;
  pointer-events: auto;
`;

// The pull tab button
export const PullTab = styled.button<{ 
  accentColor: string;
  isOpen: boolean;
}>`
  width: 52px;
  height: 26px;
  background: ${(props) => props.accentColor};
  border: none;
  border-radius: 0 0 14px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &:hover {
    height: 32px;
  }

  &::after {
    content: '${(props) => (props.isOpen ? '▲' : '▼')}';
    color: rgba(255, 255, 255, 0.9);
    font-size: 10px;
    transition: transform 0.3s ease;
  }

  &:focus {
    outline: none;
  }
`;

// The expandable drawer panel
export const DrawerPanel = styled.div<{ 
  isOpen: boolean;
  accentColor: string;
}>`
  width: 260px;
  background: rgba(20, 20, 30, 0.95);
  border-radius: 0 0 20px 20px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid ${(props) => props.accentColor};
  
  max-height: ${(props) => (props.isOpen ? '300px' : '0')};
  opacity: ${(props) => (props.isOpen ? '1' : '0')};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: ${(props) => (props.isOpen ? 'auto' : 'none')};
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

// Toggle button for grid/fisheye
export const ToggleButton = styled.button<{ 
  isActive: boolean;
  accentColor: string;
}>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid ${(props) => 
    props.isActive ? props.accentColor : 'rgba(255, 255, 255, 0.2)'};
  background: ${(props) => 
    props.isActive ? props.accentColor : 'rgba(255, 255, 255, 0.05)'};
  color: ${(props) => 
    props.isActive ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => 
      props.isActive ? props.accentColor : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${(props) => 
      props.isActive ? props.accentColor : 'rgba(255, 255, 255, 0.3)'};
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  border: ${(props) => (props.isMain ? '2px' : '1px')} solid rgba(255, 255, 255, 0.2);
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// Current color display (shown on the handle)
export const CurrentColorBadge = styled.button<{ color: string }>`
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  background: ${(props) => props.color};
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 10px;
  font-family: 'Monaco', 'Menlo', monospace;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  z-index: 21;
  pointer-events: auto;

  &:hover {
    transform: translateX(-50%) scale(1.05);
    border-color: white;
  }

  &:focus {
    outline: none;
  }
`;


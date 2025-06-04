import { useState, useCallback, useMemo } from 'react';
import {
  generateMaterialPalette,
  generatePalette,
  hexToRgb,
  parseRgbColor,
  rgbToHex
} from '../utils/color-utils';

export function calculateLuminance(color: {
  r: number;
  g: number;
  b: number;
}): number {
  return (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
}

export function getContrastColor(color: string): string {
  const parsedColor = parseRgbColor(color);
  if (!parsedColor) return '#ffffff';

  const luminance = calculateLuminance(parsedColor);
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Hook for managing color-related state and utilities
export function useColorDetection(
  setColorPalette: (colorPalette: string[]) => void,
  setMaterialPalette: (materialPalette: Record<number, string>) => void,
  setHoveredColor: (hoveredColor: string) => void
) {
  const [contrastColor, setContrastColor] = useState<string>('#ffffff');

  const updateSelectedColor = useCallback((newColor: string) => {
    setHoveredColor(newColor);
    setContrastColor(getContrastColor(newColor));
    const newPalette = generatePalette(newColor, 'monochromatic');
    setColorPalette(newPalette);
    const materialPalette = generateMaterialPalette(newColor);
    setMaterialPalette(materialPalette);
  }, []);

  // Memoized color utilities
  const colorUtils = useMemo(
    () => ({
      parseRgbColor,
      calculateLuminance,
      getContrastColor,
      rgbToHex,
      hexToRgb
    }),
    []
  );

  return {
    contrastColor,
    updateSelectedColor,
    colorUtils
  };
}

// Optional canvas-based color detection
export function detectPixelColor(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  x?: number,
  y?: number
): string | null {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Default to center if no coordinates provided
  const posX = x ?? Math.floor(canvas.width / 2);
  const posY = y ?? Math.floor(canvas.height / 2);

  try {
    const pixel = ctx.getImageData(posX, posY, 1, 1);
    return `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
  } catch (error) {
    console.error('Error detecting pixel color:', error);
    return null;
  }
}

import { useState, useCallback, useMemo } from 'react';

// Utility functions for color manipulation
export function parseRgbColor(
  color: string
): { r: number; g: number; b: number } | null {
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length !== 3) {
    console.error('Invalid RGB color string:', color);
    return null;
  }

  return {
    r: parseInt(rgbMatch[0]),
    g: parseInt(rgbMatch[1]),
    b: parseInt(rgbMatch[2])
  };
}

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

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

// Hook for managing color-related state and utilities
export function useColorDetection(initialColor?: string) {
  const [hoveredColor, setHoveredColor] = useState<string>(
    initialColor || '#000000'
  );
  const [contrastColor, setContrastColor] = useState<string>('#ffffff');

  const updateSelectedColor = useCallback((newColor: string) => {
    setHoveredColor(newColor);
    setContrastColor(getContrastColor(newColor));
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
    hoveredColor,
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

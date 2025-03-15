import * as React from 'react';

export const getContrastColor = React.useCallback((color: string): string => {
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length !== 3) {
    console.error('Invalid RGB color string:', color);
    return '#ffffff'; // Default to white if parsing fails
  }

  const [r, g, b] = rgbMatch.map(Number);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Choose white or black based on luminance
  const contrastColor = luminance > 0.5 ? '#000000' : '#ffffff';
  return contrastColor;
}, []);

export const extractPixelColor = (
  canvas: HTMLCanvasElement,
  x: number = canvas.width / 2,
  y: number = canvas.height / 2
): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get canvas context');
    return 'rgb(0,0,0)';
  }

  const pixel = ctx.getImageData(x, y, 1, 1);
  return `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
};

export const getContrastColorFromRGB = (color: string): string => {
  const rgbMatch = color.match(/\d+/g);
  if (!rgbMatch || rgbMatch.length !== 3) {
    console.error('Invalid RGB color string:', color);
    return '#ffffff';
  }

  const [r, g, b] = rgbMatch.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
};

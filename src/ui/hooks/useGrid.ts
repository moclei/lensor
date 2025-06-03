import { useState, useCallback, useEffect, useRef } from 'react';

interface UseGridDrawingProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isGridVisible: boolean;
  zoom: number;
  pixelScalingEnabled: boolean;
  canvasSize?: number;
  gridColor?: string;
  gridLineWidth?: number;
}

interface GridDrawingOptions {
  color?: string;
  lineWidth?: number;
}

export function useGrid({
  canvasRef,
  isGridVisible,
  zoom,
  canvasSize = 400,
  gridColor = '#000000',
  gridLineWidth = 0.5
}: UseGridDrawingProps) {
  const [isGridDrawn, setIsGridDrawn] = useState(false);

  // Memoized grid drawing function
  const drawGrid = useCallback(
    (options: GridDrawingOptions = {}) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear previous grid
      console.log('[useGrid] Clearing previous grid');
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      if (!isGridVisible) {
        setIsGridDrawn(false);
        return;
      }

      const cssPixelsToShow = canvasSize / zoom;
      const cssPixelSizeOnCanvas = canvasSize / cssPixelsToShow;
      const gridSpacing = cssPixelSizeOnCanvas;

      // Use provided or default styling
      ctx.strokeStyle = options.color || gridColor;
      ctx.lineWidth = options.lineWidth || gridLineWidth;

      ctx.beginPath();

      // Draw vertical lines
      for (let x = 0; x <= canvasSize; x += gridSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize);
      }

      // Draw horizontal lines
      for (let y = 0; y <= canvasSize; y += gridSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize, y);
      }

      ctx.stroke();
      setIsGridDrawn(true);
    },
    [canvasRef, isGridVisible, canvasSize, gridColor, gridLineWidth, zoom]
  );

  // Draw crosshairs in the center of the canvas
  const drawCrosshairs = useCallback(
    (options: GridDrawingOptions = {}) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const centerX = canvasSize / 2;
      const centerY = canvasSize / 2;

      const crosshairColor = options.color || 'black';
      const crosshairWidth = options.lineWidth || 2;
      const crosshairLength = 20;

      ctx.save();
      ctx.strokeStyle = crosshairColor;
      ctx.lineWidth = crosshairWidth;

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(centerX - crosshairLength / 2, centerY);
      ctx.lineTo(centerX + crosshairLength / 2, centerY);
      ctx.stroke();

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - crosshairLength / 2);
      ctx.lineTo(centerX, centerY + crosshairLength / 2);
      ctx.stroke();

      ctx.restore();
    },
    [canvasRef, canvasSize]
  );

  // Effect to handle grid drawing when dependencies change
  useEffect(() => {
    if (isGridVisible) {
      drawGrid();
    }
  }, [isGridVisible, drawGrid]);

  return {
    drawGrid,
    drawCrosshairs,
    isGridDrawn
  };
}

// Utility function for creating a grid canvas
export function createGridCanvas(
  width: number = 400,
  height: number = 400
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

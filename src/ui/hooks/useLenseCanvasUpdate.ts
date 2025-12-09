import { useState, useCallback, useRef } from 'react';
import FisheyeGl, { Fisheye } from '../../lib/fisheyegl';
import { DebugInfoProps } from '../utils/debug-utils';
import { useLensorState } from './useLensorState';

interface UseLenseCanvasUpdateProps {
  imageBitmap: ImageBitmap | null;
  containerRef: React.RefObject<HTMLDivElement>;
  mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  interCanvasRef: React.RefObject<HTMLCanvasElement>;
  fisheyeCanvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  fisheyeOn: boolean;
}

export function useLenseCanvasUpdate({
  imageBitmap,
  containerRef,
  mainCanvasRef,
  interCanvasRef,
  fisheyeCanvasRef,
  zoom,
  fisheyeOn
}: UseLenseCanvasUpdateProps) {
  console.log('[useLenseCanvasUpdate] Hook called with:', {
    hasImage: !!imageBitmap,
    zoom,
    fisheyeOn
  });

  const distorterRef = useRef<Fisheye | null>(null);
  const CANVAS_SIZE = 400;

  const updateSelectedPixel = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx) return null;

    const pixel = ctx.getImageData(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 1, 1);
    return `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
  }, []);

  const calculateCropCoordinates = useCallback(() => {
    if (!containerRef.current || !imageBitmap) {
      console.log(
        '[useLenseCanvasUpdate] calculateCropCoordinates skipping because not initialized'
      );
      return {
        sourceX: 0,
        sourceY: 0,
        sourceW: 0,
        sourceH: 0
      };
    }
    const canvasRect = containerRef.current.getBoundingClientRect();

    const canvasTopLeftX = canvasRect.left;
    const canvasTopLeftY = canvasRect.top;
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    const canvasCenterX = canvasTopLeftX + canvasWidth / 2;
    const canvasCenterY = canvasTopLeftY + canvasHeight / 2;

    const scaleWidth = imageBitmap.width / window.innerWidth;
    const scaleHeight = imageBitmap.height / window.innerHeight;

    const userZoomLevel = zoom;
    const cssPixelsToShow = CANVAS_SIZE / userZoomLevel; // 400/4 = 100 CSS pixels
    const capturedPixelsToShow = cssPixelsToShow * scaleWidth; // 100 * 2 = 200 captured pixels

    const captureWidth = capturedPixelsToShow;
    const captureHeight = capturedPixelsToShow;

    const originOffsetX = -captureWidth / 2;
    const originOffsetY = -captureHeight / 2;

    const dx = canvasCenterX;
    const dy = canvasCenterY;

    const captureTopLeftX = originOffsetX + dx * scaleWidth;
    const captureTopLeftY = originOffsetY + dy * scaleHeight;

    const sourceW = captureWidth;
    const sourceH = captureHeight;

    console.log('[Zoom Analysis]', {
      userZoomLevel,
      cssPixelsToShow,
      capturedPixelsToShow,
      viewportSize: { width: window.innerWidth, height: window.innerHeight },
      imageBitmapSize: { width: imageBitmap.width, height: imageBitmap.height },
      scaleFactors: { scaleWidth, scaleHeight },
      devicePixelRatio: window.devicePixelRatio,
      cropSize: { captureWidth, captureHeight },
      implicitZoom: scaleWidth // This is your actual zoom factor!
    });

    const result = {
      sourceX: captureTopLeftX,
      sourceY: captureTopLeftY,
      sourceW,
      sourceH
    };

    console.log('[useLenseCanvasUpdate] Calculated crop coordinates:', result);
    return result;
  }, [imageBitmap, containerRef, zoom]);

  const updateCanvas = useCallback((): string | null => {
    console.log('[useLenseCanvasUpdate] updateCanvas called with state:', {
      hasMainCanvas: !!mainCanvasRef.current,
      hasInterCanvas: !!interCanvasRef.current,
      hasImage: !!imageBitmap
    });

    if (!mainCanvasRef.current || !interCanvasRef.current || !imageBitmap) {
      console.log(
        '[useLenseCanvasUpdate] updateCanvas skipping because not initialized'
      );
      return null;
    }

    const mainCtx = mainCanvasRef.current.getContext('2d');
    const interCtx = interCanvasRef.current.getContext('2d');

    if (!mainCtx || !interCtx) {
      console.log('[useLenseCanvasUpdate] updateCanvas failed to get context');
      return null;
    }

    console.log('[useLenseCanvasUpdate] Clearing canvases');
    mainCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    interCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const { sourceX, sourceY, sourceW, sourceH } = calculateCropCoordinates();

    if (fisheyeOn) {
      console.log('[useLenseCanvasUpdate] Drawing with fisheye effect');
      // Draw the zoomed image to the intermediate canvas first
      interCtx.drawImage(
        imageBitmap,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        CANVAS_SIZE,
        CANVAS_SIZE
      );

      // Create FisheyeGl instance if needed
      if (!distorterRef.current) {
        distorterRef.current = FisheyeGl({
          canvas: fisheyeCanvasRef.current,
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
      }

      // Use setCanvasSource for synchronous rendering (no Image loading, no rAF delay)
      distorterRef.current.setCanvasSource(interCanvasRef.current);
      mainCtx.drawImage(distorterRef.current.getCanvas(), 0, 0);
    } else {
      console.log('[useLenseCanvasUpdate] Drawing without fisheye');
      try {
        mainCtx.drawImage(
          imageBitmap,
          sourceX,
          sourceY,
          sourceW,
          sourceH,
          0,
          0,
          CANVAS_SIZE,
          CANVAS_SIZE
        );
        console.log('[useLenseCanvasUpdate] Successfully drew image on canvas');
      } catch (error) {
        console.error('[useLenseCanvasUpdate] Error drawing image:', error);
        return null;
      }
    }

    const color = updateSelectedPixel(mainCtx);
    console.log('[useLenseCanvasUpdate] Selected pixel color:', color);
    return color;
  }, [
    mainCanvasRef,
    interCanvasRef,
    fisheyeCanvasRef,
    imageBitmap,
    fisheyeOn,
    updateSelectedPixel,
    calculateCropCoordinates
  ]);

  return {
    updateCanvas,
    calculateCropCoordinates
  };
}

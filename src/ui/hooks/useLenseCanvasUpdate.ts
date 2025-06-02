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
  pixelScalingEnabled: boolean;
  fisheyeOn: boolean;
}

export function useLenseCanvasUpdate({
  imageBitmap,
  containerRef,
  mainCanvasRef,
  interCanvasRef,
  fisheyeCanvasRef,
  zoom,
  pixelScalingEnabled,
  fisheyeOn
}: UseLenseCanvasUpdateProps) {
  console.log('[useLenseCanvasUpdate] Hook called with:', {
    hasImage: !!imageBitmap,
    zoom,
    pixelScalingEnabled,
    fisheyeOn
  });

  const [effectiveZoom, setEffectiveZoom] = useState(zoom);
  const distorterRef = useRef<Fisheye | null>(null);
  const CANVAS_SIZE = 400;

  const { useStateItem } = useLensorState();
  const [imageCropX, setImageCropX] = useStateItem('imageCropX');
  const [imageCropY, setImageCropY] = useStateItem('imageCropY');

  // // Calculate effective zoom based on pixel scaling
  // useEffect(() => {
  //   const zoomLevel = pixelScalingEnabled
  //     ? zoom * window.devicePixelRatio
  //     : zoom;
  //   setEffectiveZoom(zoomLevel);
  // }, [zoom, pixelScalingEnabled]);

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

    const pixelRatio = window.devicePixelRatio;

    const zoom = 1; // 1 = 100% zoom, 1.5 = 200% zoom, 2 = 300% zoom, 2.5 = 400% zoom

    const captureWidth = 400 / zoom;
    const captureHeight = 400 / zoom;

    const canvasTopLeftX = canvasRect.left;
    const canvasTopLeftY = canvasRect.top;
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    const canvasCenterX = canvasTopLeftX + canvasWidth / 2;
    const canvasCenterY = canvasTopLeftY + canvasHeight / 2;

    const scaleWidth = imageBitmap.width / window.innerWidth;
    const scaleHeight = imageBitmap.height / window.innerHeight;

    const originOffsetX = -captureWidth / 2;
    const originOffsetY = -captureHeight / 2;

    // Scenario 1
    // imageBitmap (source) is 1000px wide, 2000px tall
    // webpage is 500px wide, 1000px tall
    // canvas is 400px wide, 400px tall
    // capture window (from imageBitmap) is 400px wide, 400px tall

    // when canvas top left is -200, -200
    // canvas center is 0, 0
    // capture top left  is -200, -200, center is 0, 0

    // when canvas top left is -190, -190 (+10x, +10y movement)
    // canvas center is 10, 10
    // capture top left is -200 + 10 * scaleWidth, -200 + 10 * scaleHeight

    // when canvas top left is 100, 200 (+300x, +400y movement)
    // canvas center is 300, 400
    // capture top left is -200 + 300 * scaleWidth, -200 + 400 * scaleHeight

    // Scenario 2
    // imageBitmap (source) is 1000px wide, 2000px tall
    // webpage is 500px wide, 1000px tall
    // canvas is 400px wide, 400px tall
    // capture window (from imageBitmap) is 300px wide, 300px tall

    // when canvas top left is -190, -190 (+10x, +10y movement)
    // canvas center is 10, 10
    // capture top left is -150 + 10 * scaleWidth, -150 + 10 * scaleHeight

    const dx = canvasCenterX;
    const dy = canvasCenterY;

    const captureTopLeftX = originOffsetX + dx * scaleWidth;
    const captureTopLeftY = originOffsetY + dy * scaleHeight;

    const sourceW = captureWidth;
    const sourceH = captureHeight;

    const result = {
      sourceX: captureTopLeftX,
      sourceY: captureTopLeftY,
      sourceW,
      sourceH
    };

    console.log('[useLenseCanvasUpdate] Calculated crop coordinates:', result);
    return result;
  }, [imageBitmap, containerRef, imageCropX, imageCropY]);

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
      // Fisheye rendering logic
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
      const fisheyeImageDataUrl = interCanvasRef.current.toDataURL();

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

      distorterRef.current.setImage(fisheyeImageDataUrl);
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
    imageCropX,
    imageCropY,
    effectiveZoom,
    fisheyeOn,
    updateSelectedPixel,
    calculateCropCoordinates
  ]);

  return { updateCanvas, effectiveZoom, calculateCropCoordinates };
}

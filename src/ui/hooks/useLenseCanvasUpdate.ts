import { useState, useCallback, useEffect, useRef } from 'react';
import FisheyeGl, { Fisheye } from '../../lib/fisheyegl';

interface UseLenseCanvasUpdateProps {
  imageBitmap: ImageBitmap | null;
  mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  interCanvasRef: React.RefObject<HTMLCanvasElement>;
  fisheyeCanvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  pixelScalingEnabled: boolean;
  fisheyeOn: boolean;
}

export function useLenseCanvasUpdate({
  imageBitmap,
  mainCanvasRef,
  interCanvasRef,
  fisheyeCanvasRef,
  zoom,
  pixelScalingEnabled,
  fisheyeOn
}: UseLenseCanvasUpdateProps) {
  const [effectiveZoom, setEffectiveZoom] = useState(zoom);
  const distorterRef = useRef<Fisheye | null>(null);
  const CANVAS_SIZE = 400;

  // Calculate effective zoom based on pixel scaling
  useEffect(() => {
    const zoomLevel = pixelScalingEnabled
      ? zoom * window.devicePixelRatio
      : zoom;
    setEffectiveZoom(zoomLevel);
  }, [zoom, pixelScalingEnabled]);

  const updateSelectedPixel = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!ctx) return null;

    const pixel = ctx.getImageData(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 1, 1);
    return `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
  }, []);

  const updateCanvas = useCallback(
    (mousePos: { x: number; y: number }): string | null => {
      if (!mainCanvasRef.current || !interCanvasRef.current || !imageBitmap) {
        console.log('updateCanvas skipping because not initialized');
        return null;
      }

      const mainCtx = mainCanvasRef.current.getContext('2d');
      const interCtx = interCanvasRef.current.getContext('2d');

      if (!mainCtx || !interCtx) return null;

      mainCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      interCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const captureSize = CANVAS_SIZE / effectiveZoom;
      const canvasRect = mainCanvasRef.current.getBoundingClientRect();

      const lensCenter = {
        x: canvasRect.left + canvasRect.width / 2,
        y: canvasRect.top + canvasRect.height / 2
      };

      const manualYOffset = 100;
      const scale = imageBitmap.width / window.innerWidth;

      const cropX = lensCenter.x * scale - captureSize / 2;
      const cropY =
        lensCenter.y * scale - captureSize / 2 + manualYOffset * scale;

      if (fisheyeOn) {
        // Fisheye rendering logic
        interCtx.drawImage(
          imageBitmap,
          cropX,
          cropY,
          captureSize,
          captureSize,
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
        mainCtx.drawImage(
          imageBitmap,
          cropX,
          cropY,
          captureSize,
          captureSize,
          0,
          0,
          CANVAS_SIZE,
          CANVAS_SIZE
        );
      }

      return updateSelectedPixel(mainCtx);
    },
    [
      mainCanvasRef,
      interCanvasRef,
      fisheyeCanvasRef,
      imageBitmap,
      effectiveZoom,
      fisheyeOn,
      updateSelectedPixel
    ]
  );

  return { updateCanvas, effectiveZoom };
}

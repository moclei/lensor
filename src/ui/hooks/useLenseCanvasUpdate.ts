import { useState, useCallback, useEffect, useRef } from 'react';
import FisheyeGl, { Fisheye } from '../../lib/fisheyegl';
import { DebugInfoProps } from '../utils/debug-utils';
import { useLensorState } from './useLensorState';

interface UseLenseCanvasUpdateProps {
  imageBitmap: ImageBitmap | null;
  mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  interCanvasRef: React.RefObject<HTMLCanvasElement>;
  fisheyeCanvasRef: React.RefObject<HTMLCanvasElement>;
  zoom: number;
  pixelScalingEnabled: boolean;
  fisheyeOn: boolean;
  setDebugInfo: (value: React.SetStateAction<DebugInfoProps>) => void;
}

export function useLenseCanvasUpdate({
  imageBitmap,
  mainCanvasRef,
  interCanvasRef,
  fisheyeCanvasRef,
  zoom,
  pixelScalingEnabled,
  fisheyeOn,
  setDebugInfo
}: UseLenseCanvasUpdateProps) {
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
    if (!mainCanvasRef.current || !imageBitmap) {
      return {
        sourceX: 0,
        sourceY: 0,
        sourceW: 0,
        sourceH: 0
      };
    }
    const canvasRect = mainCanvasRef.current.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio;

    const scaleWidth = imageBitmap.width / window.innerWidth;
    const scaleHeight = imageBitmap.height / window.innerHeight;

    const sourceX = canvasRect.left * scaleWidth;
    const sourceY = canvasRect.top * scaleHeight;

    const scaleMax = Math.max(scaleWidth, scaleHeight);
    const sourceW = CANVAS_SIZE * (scaleMax / pixelRatio);
    const sourceH = sourceW; //CANVAS_SIZE * scaleHeight;

    return {
      sourceX,
      sourceY,
      sourceW,
      sourceH
    };
  }, [imageBitmap, mainCanvasRef, imageCropX, imageCropY]);

  const oldCalculateCropCoordinates = useCallback(() => {
    if (!mainCanvasRef.current || !imageBitmap) {
      return {
        sourceX: 0,
        sourceY: 0,
        sourceW: 0,
        sourceH: 0
      };
    }
    const canvasRect = mainCanvasRef.current.getBoundingClientRect();

    const lensCenter = {
      x: canvasRect.left + canvasRect.width / 2,
      y: canvasRect.top + canvasRect.height / 2
    };

    // Adjust lensCenter to account for border
    const borderWidth = 8; // Taken from styles. Need to make this dynamic
    const adjustedLensCenter = {
      x: lensCenter.x + borderWidth,
      y: lensCenter.y - borderWidth
    };

    // const manualYOffset = 100;
    // const scale = imageBitmap.width / window.innerWidth;
    const scaleWidth = imageBitmap.width / window.innerWidth;
    const scaleHeight = imageBitmap.height / window.innerHeight;
    // const scale = Math.max(scaleWidth, scaleHeight);

    // const captureSize = CANVAS_SIZE / effectiveZoom;
    // Size of the crop area
    const captureSize = CANVAS_SIZE / effectiveZoom;

    // Calculate crop coordinates
    const cropX =
      adjustedLensCenter.x * scaleWidth - captureSize / 2 + imageCropX;
    const cropY =
      adjustedLensCenter.y * scaleHeight - captureSize / 2 + imageCropY;

    return {
      sourceX: cropX,
      sourceY: cropY,
      sourceW: captureSize,
      sourceH: captureSize
    };
  }, [imageBitmap, mainCanvasRef, imageCropX, imageCropY]);

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

      const { sourceX, sourceY, sourceW, sourceH } = calculateCropCoordinates();

      if (fisheyeOn) {
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
      }

      // Calculate window ratio
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const windowRatio = (windowWidth / windowHeight).toFixed(2);

      // Calculate bitmap ratio
      const bitmapWidth = imageBitmap.width;
      const bitmapHeight = imageBitmap.height;
      const bitmapRatio = (bitmapWidth / bitmapHeight).toFixed(2);

      // Log the ratios
      const windowLog = `${windowWidth}:${windowHeight} (${windowRatio}:1)`;
      const bitmapLog = `${bitmapWidth}:${bitmapHeight} (${bitmapRatio}:1)`;

      setDebugInfo((prevState) => ({
        ...prevState,
        cropCoordinates: {
          x: sourceX,
          y: sourceY,
          width: sourceW,
          height: sourceH
        },
        captureSize: CANVAS_SIZE / effectiveZoom,
        scaleWidth: imageBitmap.width / window.innerWidth,
        scaleHeight: imageBitmap.height / window.innerHeight,
        lensCenter: {
          x: sourceX + sourceW / 2,
          y: sourceY + sourceH / 2
        },
        imageBitmapInfo: {
          width: imageBitmap.width,
          height: imageBitmap.height
        },
        windowRatio: windowLog,
        bitmapRatio: bitmapLog
      }));

      return updateSelectedPixel(mainCtx);
    },
    [
      mainCanvasRef,
      interCanvasRef,
      fisheyeCanvasRef,
      imageBitmap,
      imageCropX,
      imageCropY,
      effectiveZoom,
      fisheyeOn,
      updateSelectedPixel,
      setDebugInfo
    ]
  );

  return { updateCanvas, effectiveZoom };
}

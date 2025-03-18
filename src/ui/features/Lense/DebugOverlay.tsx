import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { StyledDebugOverlay, StyledDebugInfo } from './Lense.styles';
import { DebugInfoProps, useDebugInfo } from '@/ui/utils/debug-utils';
import { styled } from 'styled-components';

const DebugCanvas = styled.canvas<{
  width: number;
  height: number;
}>`
  position: fixed;
  z-index: 9999999;
  right: 18px;
  bottom: 18px;
  border: 1px solid black;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
`;

type Metrics = {
  widthScaleFactor: number;
  heightScaleFactor: number;
  possibleLetterboxing: boolean;
  possiblePillarboxing: boolean;
  estimatedTopBottomBorderHeight: number;
  estimatedLeftRightBorderWidth: number;
  windowWidth: number;
  windowHeight: number;
  windowAspectRatio: number;
  captureWidth: number;
  captureHeight: number;
  captureAspectRatio: number;
  screenWidth: number;
  screenHeight: number;
  screenAspectRatio: number;
  devicePixelRatio: number;
  isFullscreen: boolean;
  zoomLevel: number;
  effectiveZoom: number;
  cropCoordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

let metrics: Metrics = {
  widthScaleFactor: 0,
  heightScaleFactor: 0,
  possibleLetterboxing: false,
  possiblePillarboxing: false,
  estimatedTopBottomBorderHeight: 0,
  estimatedLeftRightBorderWidth: 0,
  windowWidth: 0,
  windowHeight: 0,
  windowAspectRatio: 0,
  captureWidth: 0,
  captureHeight: 0,
  captureAspectRatio: 0,
  screenWidth: 0,
  screenHeight: 0,
  screenAspectRatio: 0,
  devicePixelRatio: 0,
  isFullscreen: false,
  effectiveZoom: 0,
  zoomLevel: 0,
  cropCoordinates: { x: 0, y: 0, width: 0, height: 0 }
};

const DEBUG_CANVAS_SIZE = 400;

export const DebugOverlay: React.FC<{
  debugInfo: DebugInfoProps;
  imageBitmap: ImageBitmap | null;
}> = ({ debugInfo, imageBitmap }) => {
  const {
    lensCenter,
    cropCoordinates,
    scaleWidth,
    scaleHeight,
    effectiveZoom,
    imageBitmapInfo,
    captureSize,
    windowRatio,
    bitmapRatio
  } = debugInfo;

  const [borderWidth, setBorderWidth] = useState(0);
  const [borderHeight, setBorderHeight] = useState(0);

  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (imageBitmap) {
      metrics = collectCaptureMetrics();
    }
  }, [imageBitmap]);

  useEffect(() => {
    if (debugCanvasRef.current && (borderWidth > 0 || borderHeight > 0)) {
      const ctx = debugCanvasRef.current.getContext('2d');
      if (ctx && imageBitmap) {
        ctx.imageSmoothingEnabled = false;

        const ratio = metrics.captureAspectRatio;
        const width = 400 / 1.2;
        const height = 400;

        debugCanvasRef.current.width = width;
        debugCanvasRef.current.height = height;

        console.log('Drawing image from source', {
          sx: borderWidth,
          sy: borderHeight,
          sw: imageBitmap.width - borderWidth * 2,
          sh: imageBitmap.height - borderHeight * 2
        });
        // Draw the entire bitmap
        ctx.drawImage(
          imageBitmap,
          borderWidth,
          borderHeight,
          imageBitmap.width - borderWidth * 2,
          imageBitmap.height - borderHeight * 2,
          0,
          0,
          width,
          height
        );
      }
    }
  }, [imageBitmap, borderWidth, borderHeight]);

  const collectCaptureMetrics = useCallback(() => {
    if (imageBitmap) {
      // Basic dimensions
      metrics = {
        // Window dimensions
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        windowAspectRatio: window.innerWidth / window.innerHeight,

        // Captured image dimensions
        captureWidth: imageBitmap.width,
        captureHeight: imageBitmap.height,
        captureAspectRatio: imageBitmap.width / imageBitmap.height,

        // Screen information
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        screenAspectRatio: window.screen.width / window.screen.height,
        devicePixelRatio: window.devicePixelRatio,

        // Browser state
        isFullscreen: document.fullscreenElement !== null,
        zoomLevel:
          (window.devicePixelRatio / window.outerWidth) * window.innerWidth,
        cropCoordinates: cropCoordinates,
        effectiveZoom: effectiveZoom,

        widthScaleFactor: 0,
        heightScaleFactor: 0,
        possibleLetterboxing: false,
        possiblePillarboxing: false,
        estimatedTopBottomBorderHeight: 0,
        estimatedLeftRightBorderWidth: 0
      };

      // Calculate potential scale factors
      metrics.widthScaleFactor = metrics.captureWidth / metrics.windowWidth;
      metrics.heightScaleFactor = metrics.captureHeight / metrics.windowHeight;

      // A more robust approach to determine letterboxing vs pillarboxing
      if (metrics.widthScaleFactor < metrics.heightScaleFactor) {
        // Height is scaled less than width, suggesting letterboxing (black bars on top/bottom)
        metrics.possibleLetterboxing = true;
        metrics.possiblePillarboxing = false;

        // What height would the capture be if it maintained window aspect ratio?
        const expectedHeight = metrics.captureWidth / metrics.windowAspectRatio;
        const totalBorderHeight = metrics.captureHeight - expectedHeight;
        metrics.estimatedTopBottomBorderHeight = totalBorderHeight / 2;
        metrics.estimatedLeftRightBorderWidth = 0;
      } else {
        // Width is scaled less than height, suggesting pillarboxing (black bars on left/right)
        metrics.possibleLetterboxing = false;
        metrics.possiblePillarboxing = true;

        // What width would the capture be if it maintained window aspect ratio?
        const expectedWidth = metrics.captureHeight * metrics.windowAspectRatio;
        const totalBorderWidth = metrics.captureWidth - expectedWidth;
        metrics.estimatedLeftRightBorderWidth = totalBorderWidth / 2;
        metrics.estimatedTopBottomBorderHeight = 0;
      }
      console.log('metrics', metrics);
    }
    setBorderWidth(metrics.estimatedLeftRightBorderWidth);
    setBorderHeight(metrics.estimatedTopBottomBorderHeight);
    return metrics;
  }, [imageBitmap]);

  return (
    <>
      <StyledDebugOverlay lenseCenter={lensCenter} />
      <StyledDebugInfo>
        {metrics && (
          <>
            <div>
              Window: {metrics.windowWidth} x {metrics.windowHeight}
            </div>
            <div>Window Aspect Ratio: {metrics.windowAspectRatio}</div>
            <div>
              Capture: {metrics.captureWidth} x {metrics.captureHeight}
            </div>
            <div>Capture Aspect Ratio: {metrics.captureAspectRatio}</div>
            <div>Width Scale Factor: {metrics.widthScaleFactor}</div>
            <div>Height Scale Factor: {metrics.heightScaleFactor}</div>
            <div>Possible Letterboxing: {metrics.possibleLetterboxing}</div>
            <div>Possible Pillarboxing: {metrics.possiblePillarboxing}</div>
            <div>
              Estimated Top Bottom Border Height:{' '}
              {metrics.estimatedTopBottomBorderHeight}
            </div>
            <div>
              Estimated Left Right Border Width:{' '}
              {metrics.estimatedLeftRightBorderWidth}
            </div>
            <div>Effective Zoom: {metrics.effectiveZoom}</div>
            <div>Zoom Level: {metrics.zoomLevel}</div>
            <div>
              Crop Coordinates: {metrics.cropCoordinates.x},{' '}
              {metrics.cropCoordinates.y}, {metrics.cropCoordinates.width},{' '}
              {metrics.cropCoordinates.height}
            </div>
          </>
        )}
      </StyledDebugInfo>
      {/* <DebugCanvas
        ref={debugCanvasRef}
        width={imageBitmap ? window.innerWidth * 0.3 : DEBUG_CANVAS_SIZE}
        height={imageBitmap ? window.innerHeight * 0.3 : DEBUG_CANVAS_SIZE}
      /> */}
    </>
  );
};

/*
      <StyledDebugInfo>
        <div>
          Lens Center: ({lensCenter.x.toFixed(2)}, {lensCenter.y.toFixed(2)})
        </div>
        <div>
          Crop Coordinates: (x:{cropCoordinates.x.toFixed(2)}, y:
          {cropCoordinates.y.toFixed(2)})
        </div>

        <div>
          Crop width and height: width:
          {cropCoordinates.width.toFixed(2)}, height:{' '}
          {cropCoordinates.height.toFixed(2)}
        </div>
        <div>Capture Size: {captureSize.toFixed(2)}</div>
        <div>
          Scale: {scaleWidth.toFixed(4)} x {scaleHeight.toFixed(4)}
        </div>
        <div>
          Image Size: {imageBitmapInfo.width} x {imageBitmapInfo.height}
        </div>
        <div>Effective Zoom: {effectiveZoom.toFixed(4)}</div>
        <div>
          Window Inner: {window.innerWidth} x {window.innerHeight}
        </div>
        <div>Window Ratio: {windowRatio}</div>
        <div>Bitmap Ratio: {bitmapRatio}</div>
        <div>Device Pixel Ratio: {window.devicePixelRatio}</div>
      </StyledDebugInfo>
*/

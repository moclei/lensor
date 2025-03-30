import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { StyledDebugOverlay, StyledDebugInfo } from './Lense.styles';
import { styled } from 'styled-components';

const DebugCanvas = styled.canvas<{
  width: number;
  height: number;
}>`
  position: fixed;
  z-index: 9999999;
  right: 18px;
  top: 18px;
  border: 1px solid black;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
`;

const ColorBox = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  background-color: ${({ color }) => color};
`;

const DEBUG_CANVAS_SIZE = 400;

export const DebugOverlay: React.FC<{
  imageBitmap: ImageBitmap | null;
  mousePos: { x: number; y: number };
  hoverColor: string;
  contrastColor: string;
  colorPalette: string[];
  materialPalette: Record<number, string>;
  effectiveZoom: number;
  containerRef: React.RefObject<HTMLDivElement>;
  calculateCropCoordinates: () => {
    sourceX: number;
    sourceY: number;
    sourceW: number;
    sourceH: number;
  };
}> = ({
  imageBitmap,
  mousePos,
  effectiveZoom,
  containerRef,
  calculateCropCoordinates,
  hoverColor,
  contrastColor,
  colorPalette,
  materialPalette
}) => {
  if (!imageBitmap) return null;

  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  const lenseCenter = useMemo(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, [containerRef]);

  const { sourceX, sourceY, sourceW, sourceH } = calculateCropCoordinates();

  useEffect(() => {
    if (debugCanvasRef.current) {
      const ctx = debugCanvasRef.current.getContext('2d');
      if (ctx && imageBitmap) {
        ctx.imageSmoothingEnabled = false;

        const ratio = imageBitmap.width / imageBitmap.height;
        const width = 400 / 1.2;
        const height = 400;

        debugCanvasRef.current.width = width;
        debugCanvasRef.current.height = height;

        const borderWidth = 0;
        const borderHeight = 0;
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
  }, [imageBitmap]);

  useEffect(() => {
    console.log('colorPalette', colorPalette);
  }, [colorPalette]);

  useEffect(() => {
    console.log('materialPalette', materialPalette);
  }, [materialPalette]);

  return (
    <>
      <StyledDebugInfo>
        <div>
          Color Palette:
          <div style={{ display: 'flex' }}>
            {colorPalette.map((color, index) => (
              <ColorBox key={index} color={color}>
                {index}
              </ColorBox>
            ))}
          </div>
        </div>
        <div>
          Material Palette:
          <div style={{ display: 'flex' }}>
            {Object.values(materialPalette).map((color, index) => (
              <ColorBox key={color} color={color}>
                {index}
              </ColorBox>
            ))}
          </div>
        </div>
        <div>
          Hover Color:
          <ColorBox color={hoverColor} />
        </div>
        <div>
          Contrast Color:
          <ColorBox color={contrastColor} />
        </div>
        <div>
          Window: {window.innerWidth} x {window.innerHeight}
        </div>
        <div>Window Aspect Ratio: {window.innerWidth / window.innerHeight}</div>
        <div>
          Capture: {imageBitmap.width} x {imageBitmap.height}
        </div>
        <div>
          Capture Aspect Ratio: {imageBitmap.width / imageBitmap.height}
        </div>
        <div>Width Scale Factor: {imageBitmap.width / window.innerWidth}</div>
        <div>
          Height Scale Factor: {imageBitmap.height / window.innerHeight}
        </div>
        <div>Effective Zoom: {effectiveZoom}</div>
        <div>
          Container Offset: left: {containerRef.current?.offsetLeft.toFixed(2)},
          top: {containerRef.current?.offsetTop.toFixed(2)}
        </div>
        <div>
          Container Bounds: left:{' '}
          {containerRef.current?.getBoundingClientRect().left.toFixed(2)}, top:{' '}
          {containerRef.current?.getBoundingClientRect().top.toFixed(2)}, width:{' '}
          {containerRef.current?.getBoundingClientRect().width.toFixed(2)},
          height:{' '}
          {containerRef.current?.getBoundingClientRect().height.toFixed(2)}
        </div>
        {containerRef.current && (
          <div>
            Target Coordinates: x:{' '}
            {containerRef.current?.getBoundingClientRect().left +
              containerRef.current?.getBoundingClientRect().width / 2}
            , y:{' '}
            {containerRef.current?.getBoundingClientRect().top +
              containerRef.current?.getBoundingClientRect().height / 2}
          </div>
        )}
        {containerRef.current && (
          <div>
            mouseXTranslated:{' '}
            {(containerRef.current?.getBoundingClientRect().left *
              imageBitmap.width) /
              window.innerWidth}
            , mouseYTranslated:{' '}
            {(containerRef.current?.getBoundingClientRect().top *
              imageBitmap.height) /
              window.innerHeight}
          </div>
        )}
        <div>
          Container Style: left: {containerRef.current?.style.left}, top:{' '}
          {containerRef.current?.style.top}, width:{' '}
          {containerRef.current?.style.width}, height:{' '}
          {containerRef.current?.style.height}
        </div>
        <div>
          Crop Coordinates: sx: {sourceX.toFixed(2)}, sy: {sourceY.toFixed(2)},
          sw: {sourceW}, sh: {sourceH}
        </div>
      </StyledDebugInfo>
      <DebugCanvas
        ref={debugCanvasRef}
        width={imageBitmap ? window.innerWidth * 0.3 : DEBUG_CANVAS_SIZE}
        height={imageBitmap ? window.innerHeight * 0.3 : DEBUG_CANVAS_SIZE}
      />
    </>
  );
};

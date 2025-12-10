interface CoordinateCalculationOptions {
  scale: number;
  effectiveZoom: number;
  canvasSize: number;
}

export const calculateCaptureRegion = (
  center: { x: number; y: number },
  options: CoordinateCalculationOptions
) => {
  const { scale, effectiveZoom, canvasSize } = options;
  const captureSize = canvasSize / effectiveZoom;
  return {
    x: center.x * scale - captureSize / 2,
    y: center.y * scale - captureSize / 2,
    width: captureSize,
    height: captureSize
  };
};

export const mapViewportToImageCoordinates = (
  viewportX: number,
  viewportY: number,
  scale: number
) => {
  return {
    imageX: viewportX * scale,
    imageY: viewportY * scale
  };
};

export const adjustForScroll = (coordinates: { x: number; y: number }) => {
  return {
    x: coordinates.x + window.scrollX,
    y: coordinates.y + window.scrollY
  };
};

export const calculateCanvasCenter = (
  canvasRef: React.RefObject<HTMLCanvasElement>
): { x: number; y: number } => {
  const canvas = canvasRef.current;
  if (!canvas) {
    console.error('Canvas not initialized');
    return { x: 0, y: 0 };
  }

  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
};

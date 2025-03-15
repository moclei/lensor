interface GridDrawingOptions {
  ctx: CanvasRenderingContext2D;
  canvasSize: number;
  spacing: number;
  lineWidth?: number;
  strokeStyle?: string;
}

export const drawGrid = ({
  ctx,
  canvasSize,
  spacing,
  lineWidth = 0.5,
  strokeStyle = '#000000'
}: GridDrawingOptions) => {
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  // Vertical lines
  for (let x = 0; x <= canvasSize; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasSize);
  }

  // Horizontal lines
  for (let y = 0; y <= canvasSize; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvasSize, y);
  }

  ctx.stroke();
};

export const drawCrosshairs = (
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  options?: {
    color?: string;
    width?: number;
    length?: number;
  }
) => {
  const { color = 'black', width = 2, length = 20 } = options || {};

  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - length / 2, centerY);
  ctx.lineTo(centerX + length / 2, centerY);
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - length / 2);
  ctx.lineTo(centerX, centerY + length / 2);
  ctx.stroke();

  ctx.restore();
};

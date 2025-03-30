import { useCallback, useRef, useEffect } from 'react';

interface UseDraggableOptions {
  handleRef: React.RefObject<HTMLElement>;
  updateCanvas: (coords: { x: number; y: number }) => void;
  borderWidth?: number;
}

export function useDraggable({
  handleRef,
  updateCanvas,
  borderWidth = 0
}: UseDraggableOptions) {
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const currentPositionRef = useRef({ x: 0, y: 0 });

  // Calculate boundary constraints
  const calculateBoundaries = useCallback(() => {
    const handle = handleRef.current;
    if (!handle)
      return {
        minX: -Infinity,
        maxX: Infinity,
        minY: -Infinity,
        maxY: Infinity
      };

    const handleRect = handle.getBoundingClientRect();
    const halfWidth = handleRect.width / 2;
    const halfHeight = handleRect.height / 2;

    return {
      minX: -halfWidth + borderWidth,
      maxX: window.innerWidth - halfWidth - borderWidth,
      minY: -halfHeight + borderWidth,
      maxY: window.innerHeight - halfHeight - borderWidth
    };
  }, [handleRef, borderWidth]);

  const constrainPosition = useCallback(
    (newX: number, newY: number) => {
      const boundaries = calculateBoundaries();

      const constrainedX = Math.max(
        boundaries.minX,
        Math.min(newX, boundaries.maxX)
      );

      const constrainedY = Math.max(
        boundaries.minY,
        Math.min(newY, boundaries.maxY)
      );

      return {
        x: constrainedX,
        y: constrainedY
      };
    },
    [calculateBoundaries]
  );

  const updatePosition = useCallback(
    (deltaX: number, deltaY: number) => {
      const handle = handleRef.current;
      if (!handle) return;

      const newX = currentPositionRef.current.x + deltaX;
      const newY = currentPositionRef.current.y + deltaY;

      const { x, y } = constrainPosition(newX, newY);
      currentPositionRef.current = { x, y };

      handle.style.left = `${x}px`;
      handle.style.top = `${y}px`;

      // Calculate the true center of the lens
      const centerX = x + handle.offsetWidth / 2;
      const centerY = y + handle.offsetHeight / 2;

      // Account for scroll position
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      updateCanvas({
        x: centerX + scrollX,
        y: centerY + scrollY
      });
    },
    [handleRef, updateCanvas, constrainPosition]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.pageX - lastPositionRef.current.x;
      const deltaY = e.pageY - lastPositionRef.current.y;

      lastPositionRef.current = { x: e.pageX, y: e.pageY };

      updatePosition(deltaX, deltaY);
    },
    [updatePosition]
  );

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      lastPositionRef.current = { x: e.pageX, y: e.pageY };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [onMouseMove, onMouseUp]
  );

  useEffect(() => {
    const handle = handleRef.current;
    if (handle) {
      handle.addEventListener('mousedown', onMouseDown);
    }

    return () => {
      if (handle) {
        handle.removeEventListener('mousedown', onMouseDown);
      }
    };
  }, [handleRef, onMouseDown]);

  // Initialize position from initialPosition prop
  useEffect(() => {
    const handle = handleRef.current;
    if (handle) {
      const rect = handle.getBoundingClientRect();
      currentPositionRef.current = { x: rect.left, y: rect.top };
    }
  }, [handleRef]);

  // New function to simulate a drag operation
  const simulateDrag = useCallback(
    (deltaX: number, deltaY: number) => {
      updatePosition(deltaX, deltaY);
    },
    [updatePosition]
  );

  return { simulateDrag, lastPositionRef };
}

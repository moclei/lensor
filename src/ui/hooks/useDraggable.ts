import { useCallback, useRef, useEffect } from 'react';

interface UseDraggableOptions {
  movableElementRef: React.RefObject<HTMLElement>;
  dragHandleRef?: React.RefObject<HTMLElement>;
  updateCanvas: (coords: { x: number; y: number }) => void;
  initialPosition: { x: number; y: number };
  onDragEnd: (position: { x: number; y: number }) => void;
  borderWidth?: number;
}

export function useDraggable({
  movableElementRef,
  dragHandleRef,
  updateCanvas,
  initialPosition,
  onDragEnd,
  borderWidth = 0
}: UseDraggableOptions) {
  const isDraggingRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const canvasPositionRef = useRef({
    x: initialPosition.x,
    y: initialPosition.y
  });

  const effectiveDragHandleRef = dragHandleRef || movableElementRef;

  const calculateBoundaries = useCallback(() => {
    const movableElement = movableElementRef.current;
    if (!movableElement)
      return {
        minX: -Infinity,
        maxX: Infinity,
        minY: -Infinity,
        maxY: Infinity
      };

    const handleRect = movableElement.getBoundingClientRect();
    const halfWidth = handleRect.width / 2;
    const halfHeight = handleRect.height / 2;

    return {
      minX: -halfWidth + borderWidth,
      maxX: window.innerWidth - halfWidth - borderWidth,
      minY: -halfHeight + borderWidth,
      maxY: window.innerHeight - halfHeight - borderWidth
    };
  }, [movableElementRef, borderWidth]);

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
      console.log(
        `[useDraggable] updatePosition called with delta: ${deltaX}, ${deltaY}`
      );
      const movableElement = movableElementRef.current;
      if (!movableElement) {
        console.warn(
          '[useDraggable] updatePosition: movableElementRef is null!'
        );
        return;
      }

      console.log(
        `[useDraggable] updatePosition: canvasPositionRef BEFORE calc: (${canvasPositionRef.current.x}, ${canvasPositionRef.current.y})`
      );

      const newX = canvasPositionRef.current.x + deltaX;
      const newY = canvasPositionRef.current.y + deltaY;

      const { x, y } = constrainPosition(newX, newY);
      console.log(
        `[useDraggable] updatePosition: Setting position to: ${x}, ${y}`
      );
      canvasPositionRef.current = { x, y };

      movableElement.style.left = `${x}px`;
      movableElement.style.top = `${y}px`;

      const centerX = x + movableElement.offsetWidth / 2;
      const centerY = y + movableElement.offsetHeight / 2;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      updateCanvas({
        x: centerX + scrollX,
        y: centerY + scrollY
      });
    },
    [movableElementRef, updateCanvas, constrainPosition]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      console.log(
        `[useDraggable] onMouseMove Fired - isDragging: ${isDraggingRef.current}`
      );
      if (!isDraggingRef.current) return;

      const prevMouseX = mousePositionRef.current.x;
      const prevMouseY = mousePositionRef.current.y;
      const currentMouseX = e.pageX;
      const currentMouseY = e.pageY;

      const deltaX = currentMouseX - prevMouseX;
      const deltaY = currentMouseY - prevMouseY;

      console.log(
        `[useDraggable] MouseMove Details: Prev: (${prevMouseX}, ${prevMouseY}), Curr: (${currentMouseX}, ${currentMouseY}), Delta: (${deltaX}, ${deltaY})`
      );

      mousePositionRef.current = { x: currentMouseX, y: currentMouseY };

      updatePosition(deltaX, deltaY);
    },
    [updatePosition]
  );

  const onMouseUp = useCallback(() => {
    console.log('[useDraggable] onMouseUp - Drag End');
    if (isDraggingRef.current) {
      onDragEnd(canvasPositionRef.current);
    }
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove, onDragEnd]);

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      console.log('[useDraggable] onMouseDown Fired');
      e.preventDefault();

      isDraggingRef.current = true;
      mousePositionRef.current = { x: e.pageX, y: e.pageY };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [onMouseMove, onMouseUp]
  );

  useEffect(() => {
    const dragHandle = effectiveDragHandleRef.current;
    if (dragHandle) {
      console.log(
        '[useDraggable] Attaching mousedown listener to:',
        dragHandle
      );
      dragHandle.addEventListener('mousedown', onMouseDown);
    } else {
      console.warn(
        '[useDraggable] Drag handle ref not available on mount for listener.'
      );
    }

    return () => {
      if (dragHandle) {
        dragHandle.removeEventListener('mousedown', onMouseDown);
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [effectiveDragHandleRef, onMouseDown, onMouseMove, onMouseUp]);

  useEffect(() => {
    canvasPositionRef.current = { x: initialPosition.x, y: initialPosition.y };
    const movableElement = movableElementRef.current;
    if (movableElement) {
      movableElement.style.left = `${initialPosition.x}px`;
      movableElement.style.top = `${initialPosition.y}px`;
    }
  }, [initialPosition, movableElementRef]);

  return { mousePositionRef };
}

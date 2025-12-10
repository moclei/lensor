import { useCallback, useRef, useEffect } from 'react';
import { debug } from '../../lib/debug';

const log = debug.drag;

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

  // Track if handlers have been initialized
  const handlersInitialized = useRef(false);

  // Track if the mousedown listener is attached
  const listenerAttached = useRef(false);

  // Store event handler functions in refs so they don't change between renders
  const onMouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const onMouseUpRef = useRef<() => void>(() => {});
  const onMouseDownRef = useRef<(e: MouseEvent) => void>(() => {});

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
      const movableElement = movableElementRef.current;
      if (!movableElement) {
        console.warn('[useDraggable] movableElementRef is null');
        return;
      }

      const newX = canvasPositionRef.current.x + deltaX;
      const newY = canvasPositionRef.current.y + deltaY;

      const { x, y } = constrainPosition(newX, newY);
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

  // Initialize event handlers once
  useEffect(() => {
    if (handlersInitialized.current) {
      return;
    }

    log('Setting up event handlers');

    onMouseMoveRef.current = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const prevMouseX = mousePositionRef.current.x;
      const prevMouseY = mousePositionRef.current.y;
      const currentMouseX = e.pageX;
      const currentMouseY = e.pageY;

      const deltaX = currentMouseX - prevMouseX;
      const deltaY = currentMouseY - prevMouseY;

      mousePositionRef.current = { x: currentMouseX, y: currentMouseY };

      updatePosition(deltaX, deltaY);
    };

    onMouseUpRef.current = () => {
      if (isDraggingRef.current) {
        log('Drag ended');
        onDragEnd(canvasPositionRef.current);
      }
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', onMouseMoveRef.current);
      document.removeEventListener('mouseup', onMouseUpRef.current);
    };

    onMouseDownRef.current = (e: MouseEvent) => {
      log('Drag started');
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      mousePositionRef.current = { x: e.pageX, y: e.pageY };

      document.addEventListener('mousemove', onMouseMoveRef.current);
      document.addEventListener('mouseup', onMouseUpRef.current);
    };

    handlersInitialized.current = true;
  }, [updatePosition, onDragEnd]);

  // Function to attach event listener
  const attachMouseDownListener = useCallback(() => {
    const dragHandle = effectiveDragHandleRef.current;

    if (!dragHandle) {
      return false;
    }

    if (listenerAttached.current) {
      // Check if the element still has the listener
      const element = dragHandle as any;
      if (element._hasMouseDownListener) {
        return true;
      }
    }

    log('Attaching mousedown listener');

    // Set a flag on the element to track if we've attached a listener
    (dragHandle as any)._hasMouseDownListener = true;
    dragHandle.addEventListener('mousedown', onMouseDownRef.current, {
      capture: true
    });
    listenerAttached.current = true;

    return true;
  }, [effectiveDragHandleRef]);

  // Monitor for changes and reattach if needed
  useEffect(() => {
    const checkAndAttachListener = () => {
      if (!handlersInitialized.current) {
        return;
      }

      attachMouseDownListener();
    };

    // Try to attach immediately
    checkAndAttachListener();

    // Then check periodically
    const intervalId = setInterval(checkAndAttachListener, 500);

    // Also check when element might become visible
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class')
        ) {
          checkAndAttachListener();
        }
      });
    });

    // Observe both elements if available
    const dragHandle = effectiveDragHandleRef.current;
    const movable = movableElementRef.current;

    if (dragHandle) {
      observer.observe(dragHandle, { attributes: true });
    }

    if (movable && movable !== dragHandle) {
      observer.observe(movable, { attributes: true });
    }

    return () => {
      clearInterval(intervalId);
      observer.disconnect();

      // Clean up event listeners
      if (listenerAttached.current) {
        const dragHandle = effectiveDragHandleRef.current;
        if (dragHandle) {
          log('Removing mousedown listener');
          dragHandle.removeEventListener('mousedown', onMouseDownRef.current, {
            capture: true
          });
        }
      }

      document.removeEventListener('mousemove', onMouseMoveRef.current);
      document.removeEventListener('mouseup', onMouseUpRef.current);
    };
  }, [attachMouseDownListener, effectiveDragHandleRef, movableElementRef]);

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

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

  // Track if handlers have been initialized
  const handlersInitialized = useRef(false);

  // Track if the mousedown listener is attached
  const listenerAttached = useRef(false);

  // Store event handler functions in refs so they don't change between renders
  const onMouseMoveRef = useRef<(e: MouseEvent) => void>((e: MouseEvent) => {
    console.log(
      '[useDraggable] Default mouseMove handler called - this should not happen'
    );
  });

  const onMouseUpRef = useRef<() => void>(() => {
    console.log(
      '[useDraggable] Default mouseUp handler called - this should not happen'
    );
  });

  const onMouseDownRef = useRef<(e: MouseEvent) => void>((e: MouseEvent) => {
    console.log(
      '[useDraggable] Default mouseDown handler called - this should not happen'
    );
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

  // Initialize event handlers once
  useEffect(() => {
    if (handlersInitialized.current) {
      return;
    }

    console.log('[useDraggable] Setting up event handlers');

    onMouseMoveRef.current = (e: MouseEvent) => {
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
    };

    onMouseUpRef.current = () => {
      console.log('[useDraggable] onMouseUp - Drag End');
      if (isDraggingRef.current) {
        onDragEnd(canvasPositionRef.current);
      }
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', onMouseMoveRef.current);
      document.removeEventListener('mouseup', onMouseUpRef.current);
    };

    onMouseDownRef.current = (e: MouseEvent) => {
      console.log('[useDraggable] onMouseDown Event Triggered');
      e.preventDefault();
      e.stopPropagation();

      isDraggingRef.current = true;
      mousePositionRef.current = { x: e.pageX, y: e.pageY };

      console.log(
        '[useDraggable] Adding document mousemove and mouseup listeners'
      );
      document.addEventListener('mousemove', onMouseMoveRef.current);
      document.addEventListener('mouseup', onMouseUpRef.current);
    };

    handlersInitialized.current = true;
  }, [updatePosition, onDragEnd]);

  // Function to attach event listener
  const attachMouseDownListener = useCallback(() => {
    const dragHandle = effectiveDragHandleRef.current;

    if (!dragHandle) {
      console.warn(
        '[useDraggable] No drag handle available to attach listener'
      );
      return false;
    }

    if (listenerAttached.current) {
      // Check if the element still has the listener
      const element = dragHandle as any;
      if (element._hasMouseDownListener) {
        return true;
      }
    }

    console.log('[useDraggable] Attaching mousedown listener to:', dragHandle);

    // Set a flag on the element to track if we've attached a listener
    (dragHandle as any)._hasMouseDownListener = true;
    dragHandle.addEventListener('mousedown', onMouseDownRef.current, {
      capture: true
    });
    listenerAttached.current = true;

    console.log('[useDraggable] mousedown listener successfully attached');
    return true;
  }, [effectiveDragHandleRef]);

  // Monitor for changes and reattach if needed
  useEffect(() => {
    const checkAndAttachListener = () => {
      if (!handlersInitialized.current) {
        console.log('[useDraggable] Handlers not initialized yet, waiting');
        return;
      }

      const success = attachMouseDownListener();
      if (!success) {
        console.log('[useDraggable] Failed to attach listener, will retry');
      }
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
          console.log(
            '[useDraggable] Element attributes changed, checking for listener reattachment'
          );
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
          console.log('[useDraggable] Removing mousedown listener');
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
    console.log('[useDraggable] Setting initial position:', initialPosition);
    canvasPositionRef.current = { x: initialPosition.x, y: initialPosition.y };
    const movableElement = movableElementRef.current;
    if (movableElement) {
      movableElement.style.left = `${initialPosition.x}px`;
      movableElement.style.top = `${initialPosition.y}px`;
    }
  }, [initialPosition, movableElementRef]);

  return { mousePositionRef };
}

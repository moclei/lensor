import { useCallback, useRef, useEffect, MutableRefObject } from 'react';

interface UseDraggableOptions {
  handleRef: React.RefObject<HTMLElement>;
  dragItemsRefs: React.RefObject<HTMLElement>[];
  offset: number;
  updateCanvas: (coords: { x: number; y: number }) => void;
  drawCanvas: () => string | null;
  borderWidth?: number;
}

export function useDraggable({
  handleRef,
  dragItemsRefs,
  offset,
  updateCanvas,
  drawCanvas,
  borderWidth = 0
}: UseDraggableOptions) {
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });

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

    // Get the first draggable item (typically the main canvas)
    const lensElement = dragItemsRefs.find((ref) => ref.current)?.current;
    if (!lensElement)
      return {
        minX: -Infinity,
        maxX: Infinity,
        minY: -Infinity,
        maxY: Infinity
      };

    const lensRect = lensElement.getBoundingClientRect();
    const halfWidth = lensRect.width / 2;
    const halfHeight = lensRect.height / 2;

    return {
      minX: -halfWidth + borderWidth,
      maxX: window.innerWidth - halfWidth - borderWidth,
      minY: -halfHeight + borderWidth,
      maxY: window.innerHeight - halfHeight - borderWidth
    };
  }, [handleRef, dragItemsRefs, borderWidth]);

  const constrainPosition = useCallback(
    (newLeft: number, newTop: number) => {
      const boundaries = calculateBoundaries();

      const constrainedLeft = Math.max(
        boundaries.minX,
        Math.min(newLeft, boundaries.maxX)
      );

      const constrainedTop = Math.max(
        boundaries.minY,
        Math.min(newTop, boundaries.maxY)
      );

      return {
        left: constrainedLeft,
        top: constrainedTop
      };
    },
    [calculateBoundaries]
  );

  const updatePosition = useCallback(
    (deltaX: number, deltaY: number) => {
      const handle = handleRef.current;
      if (!handle) return;

      const newLeft = handle.offsetLeft + deltaX;
      const newTop = handle.offsetTop + deltaY;

      const { left, top } = constrainPosition(newLeft, newTop);

      handle.style.left = `${left}px`;
      handle.style.top = `${top}px`;

      dragItemsRefs.forEach((ref) => {
        const elem = ref.current;
        if (elem) {
          elem.style.left = `${left + parseInt(elem.dataset.offsetX || '0')}px`;
          elem.style.top = `${top + parseInt(elem.dataset.offsetY || '0')}px`;
        }
      });

      // Get the lens element (assuming it's one of the dragItemsRefs)
      const lensElement = dragItemsRefs.find((ref) => ref.current)?.current;
      if (lensElement) {
        const rect = lensElement.getBoundingClientRect();

        // Calculate the true center of the lens
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Account for scroll position
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        updateCanvas({
          x: centerX + scrollX,
          y: centerY + scrollY
        });
      }
    },
    [handleRef, dragItemsRefs, updateCanvas]
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

  useEffect(() => {
    const handle = handleRef.current;
    if (handle) {
      dragItemsRefs.forEach((ref, index) => {
        const elem = ref.current;
        if (elem) {
          elem.dataset.offsetX = (
            elem.offsetLeft - handle.offsetLeft
          ).toString();
          elem.dataset.offsetY = (elem.offsetTop - handle.offsetTop).toString();
        }
      });
    }
  }, [handleRef, dragItemsRefs]);

  // New function to simulate a drag operation
  const simulateDrag = useCallback(
    (deltaX: number, deltaY: number) => {
      updatePosition(deltaX, deltaY);
    },
    [updatePosition]
  );

  return { simulateDrag };
}

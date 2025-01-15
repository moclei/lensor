import { useCallback, useRef, useEffect, MutableRefObject } from 'react';

interface UseDraggableOptions {
    handleRef: React.RefObject<HTMLElement>;
    dragItemsRefs: React.RefObject<HTMLElement>[];
    offset: number;
    updateCanvas: (coords: { x: number; y: number }) => void;
    drawCanvas: () => number;
}

export function useDraggable({
    handleRef,
    dragItemsRefs,
    offset,
    updateCanvas,
    drawCanvas
}: UseDraggableOptions) {
    const isDraggingRef = useRef(false);
    const lastPositionRef = useRef({ x: 0, y: 0 });

    const updatePosition = useCallback((deltaX: number, deltaY: number) => {
        const handle = handleRef.current;
        if (!handle) return;

        const newLeft = handle.offsetLeft + deltaX;
        const newTop = handle.offsetTop + deltaY;

        handle.style.left = `${newLeft}px`;
        handle.style.top = `${newTop}px`;

        dragItemsRefs.forEach(ref => {
            const elem = ref.current;
            if (elem) {
                elem.style.left = `${newLeft + parseInt(elem.dataset.offsetX || '0')}px`;
                elem.style.top = `${newTop + parseInt(elem.dataset.offsetY || '0')}px`;
            }
        });

        updateCanvas({ x: handle.offsetLeft + 255, y: handle.offsetTop + 205 });
    }, [handleRef, dragItemsRefs, updateCanvas]);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;

        const deltaX = e.pageX - lastPositionRef.current.x;
        const deltaY = e.pageY - lastPositionRef.current.y;

        lastPositionRef.current = { x: e.pageX, y: e.pageY };

        updatePosition(deltaX, deltaY);
    }, [updatePosition]);

    const onMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }, [onMouseMove]);

    const onMouseDown = useCallback((e: MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        lastPositionRef.current = { x: e.pageX, y: e.pageY };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [onMouseMove, onMouseUp]);

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
                    elem.dataset.offsetX = (elem.offsetLeft - handle.offsetLeft).toString();
                    elem.dataset.offsetY = (elem.offsetTop - handle.offsetTop).toString();
                }
            });
        }
    }, [handleRef, dragItemsRefs]);

    // New function to simulate a drag operation
    const simulateDrag = useCallback((deltaX: number, deltaY: number) => {
        updatePosition(deltaX, deltaY);
    }, [updatePosition]);

    return { simulateDrag };
}
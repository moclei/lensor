// Function to make an element draggable
export enum DragPosition {
    TOP = 'top',
    RIGHT = 'right',
    BOTTOM = 'bottom',
    LEFT = 'left',
    MIDDLE = 'middle'
}

export function makeDraggable(
    handle: HTMLElement,
    dragItems: HTMLElement[],
    offset: number,
    updateCanvas: (coords: { x: number, y: number }) => void,
    drawCanvas: () => number
): void {
    console.log("makeDraggable called.")
    let posInitialX: number = 0;
    let posInitialY: number = 0;
    let lensorMainCanvas: HTMLElement | null;
    let lenseCanvasRect: DOMRect | null;

    initializeDragItems();
    handle.onmousedown = dragMouseDown;
    let lastUpdateTime = 0;
    const updateInterval = 1000 / 24; // 30 updates per second

    function dragMouseDown(e: MouseEvent): void {
        e.preventDefault();
        // Get the initial mouse cursor position
        posInitialX = e.clientX;
        posInitialY = e.clientY;

        document.onmouseup = closeDragElement;
        // document.onmousemove = elementDrag;
        document.onmousemove = lensorDrag;
    }

    function requestUpdate() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastUpdateTime;

        if (elapsedTime >= updateInterval) {
            lastUpdateTime = drawCanvas();
        } else {
            setTimeout(requestUpdate, updateInterval - elapsedTime);
        }
    }

    function lensorDrag(e: MouseEvent): void {
        e.preventDefault();
        requestUpdate();
        lenseCanvasRect = lensorMainCanvas!.getBoundingClientRect();

        let positionVert = DragPosition.MIDDLE;
        let positionHoriz = DragPosition.MIDDLE;

        // Calculate the new cursor position
        const deltaX = e.clientX - posInitialX;
        const deltaY = e.clientY - posInitialY;
        posInitialX = e.clientX;
        posInitialY = e.clientY;

        // Update the handle's position
        let newHandleTop = handle.offsetTop + deltaY;
        let newHandleRight = parseInt(getComputedStyle(handle).right) - deltaX;

        let positionAdjustTop = 0;
        let positionAdjustRight = 0;

        if (lensorMainCanvas) {
            // Calculate the center point of the LenseCanvas
            let lenseCanvasCenterX = lenseCanvasRect!.left + lenseCanvasRect!.width / 2;
            let lenseCanvasCenterY = lenseCanvasRect!.top + lenseCanvasRect!.height / 2;

            // Calculate the boundaries for the center point
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const maxLeft = 0;
            const maxRight = windowWidth;
            const maxTop = 0;
            const maxBottom = windowHeight;


            // Get general position for handle positioning
            if (lenseCanvasCenterX < maxLeft + 200) {
                positionHoriz = DragPosition.LEFT;
            } else if (lenseCanvasCenterX > maxRight - 200) {
                positionHoriz = DragPosition.RIGHT;
            }

            if (lenseCanvasCenterY < maxTop + 200) {
                positionVert = DragPosition.TOP;
            } else if (lenseCanvasCenterY > maxBottom - 200) {
                positionVert = DragPosition.BOTTOM;
            }


            const positionCombination = `${positionVert}-${positionHoriz}`;

            if (!handle) return;
            switch (positionCombination) {
                case 'top-right':
                    positionAdjustRight = 200;
                    break;
                case 'bottom-left':
                    positionAdjustTop = -200;
                    break;
                case 'bottom-right':
                    positionAdjustTop = -200;
                    positionAdjustRight = 200;
                    break;
                case 'middle-right':
                    positionAdjustRight = 200;
                    break;
                case 'bottom-middle':
                    positionAdjustTop = -200;
                    break;
                case 'middle-left':
                case 'top-middle':
                case 'middle-middle':
                case 'top-left':
                    break;
            }

            // Adjust the handle position to keep the center point within boundaries
            if (lenseCanvasCenterX < maxLeft) {
                newHandleRight = maxRight - ((lenseCanvasRect!.width / 2) - 40);
            } else if (lenseCanvasCenterX > maxRight) {
                newHandleRight = maxLeft - ((lenseCanvasRect!.width / 2) - 100);
            }

            if (lenseCanvasCenterY < maxTop) {
                newHandleTop = maxTop + 100;
            } else if (lenseCanvasCenterY > maxBottom) {
                newHandleTop = maxBottom + 40;
            }



            // Update the canvas position
            updateCanvas({ x: lenseCanvasCenterX, y: lenseCanvasCenterY });
        }

        handle.style.top = (newHandleTop) + "px";
        handle.style.right = (newHandleRight) + "px";

        // Update the positions of the draggable items
        for (const item of dragItems) {
            const initialItemTop = parseInt(item.getAttribute('data-initial-top') || '0');
            const initialItemRight = parseInt(item.getAttribute('data-initial-right') || '0');
            item.style.top = (newHandleTop + initialItemTop) + "px";
            item.style.right = (newHandleRight - initialItemRight) + "px";
        }
    }

    function initializeDragItems() {
        lensorMainCanvas = dragItems.find(item => item.id === 'lensor-main-canvas') || null;
        if (!lensorMainCanvas) {
            console.error('Could not find lensor-main-canvas');
            return;
        }
        const handleTop = parseInt(getComputedStyle(handle).top);
        const handleRight = parseInt(getComputedStyle(handle).right);

        for (const item of dragItems) {
            const itemTop = parseInt(getComputedStyle(item).top);
            const itemRight = parseInt(getComputedStyle(item).right);


            const initialItemTop = itemTop - handleTop;
            const initialItemRight = handleRight - itemRight;

            console.log("itemId: ", item.id, "initialItemTop: ", initialItemTop, ", initialItemRight: ", initialItemRight);
            item.setAttribute('data-initial-top', initialItemTop.toString());
            item.setAttribute('data-initial-right', initialItemRight.toString());
        }
    }

    function closeDragElement(): void {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

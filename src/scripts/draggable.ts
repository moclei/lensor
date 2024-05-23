// Function to make an element draggable
export function makeDraggable(handle: HTMLElement, dragItems: HTMLElement[], offset: number, updateCanvas: (coords: { x: number, y: number }) => void): void {
    let posX: number = 0, posY: number = 0, posInitialX: number = 0, posInitialY: number = 0;

    initializeDragItems();
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent): void {
        e.preventDefault();
        // Get the initial mouse cursor position
        posInitialX = e.clientX;
        posInitialY = e.clientY;

        document.onmouseup = closeDragElement;
        // document.onmousemove = elementDrag;
        document.onmousemove = lensorDrag;
    }

    function lensorDrag(e: MouseEvent): void {
        e.preventDefault();

        // Calculate the new cursor position
        const deltaX = e.clientX - posInitialX;
        const deltaY = e.clientY - posInitialY;
        posInitialX = e.clientX;
        posInitialY = e.clientY;

        // Update the handle's position
        const newHandleTop = handle.offsetTop + deltaY;
        const newHandleRight = parseInt(getComputedStyle(handle).right) - deltaX;
        handle.style.top = newHandleTop + "px";
        handle.style.right = newHandleRight + "px";

        // Update the positions of the draggable items
        for (const item of dragItems) {
            if (item.id === 'lensor-main-canvas') {
                // Calculate the center point of the LenseCanvas
                const lenseCanvasRect = item.getBoundingClientRect();
                const lenseCanvasCenterX = lenseCanvasRect.left + lenseCanvasRect.width / 2;
                const lenseCanvasCenterY = lenseCanvasRect.top + lenseCanvasRect.height / 2;
                updateCanvas({ x: lenseCanvasCenterX, y: lenseCanvasCenterY });
            }
            const initialItemTop = parseInt(item.getAttribute('data-initial-top') || '0');
            const initialItemRight = parseInt(item.getAttribute('data-initial-right') || '0');
            item.style.top = (newHandleTop + initialItemTop) + "px";
            item.style.right = (newHandleRight - initialItemRight) + "px";
        }
    }

    function initializeDragItems() {
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

// Function to make an element draggable
export function makeDraggable(handle: HTMLElement, dragItems: HTMLElement[], offset: number): void {
    let posX: number = 0, posY: number = 0, posInitialX: number = 0, posInitialY: number = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e: MouseEvent): void {
        e.preventDefault();
        // Get the initial mouse cursor position
        posInitialX = e.clientX;
        posInitialY = e.clientY;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent): void {
        e.preventDefault();
        // Calculate the new cursor position
        posX = posInitialX - e.clientX;
        posY = posInitialY - e.clientY;
        posInitialX = e.clientX;
        posInitialY = e.clientY;

        for (const item of dragItems) {
            item.style.top = (handle.offsetTop - posY + offset) + "px";
            item.style.left = (handle.offsetLeft - posX + offset) + "px";
        }
        // Set the element's new position
        handle.style.top = (handle.offsetTop - posY) + "px";
        handle.style.left = (handle.offsetLeft - posX) + "px";
    }

    function closeDragElement(): void {
        // Stop moving when mouse button is released
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

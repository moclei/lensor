type InteractionState = {
    handleStop: (() => void) | null;
    handleMove: ((coords: { x: number, y: number }) => void) | null;
    handleZoom: ((change: number) => void) | null;
}

const interactionState: InteractionState = {
    handleStop: null,
    handleMove: null,
    handleZoom: null
}

function registerIxnListeners(
    actions: {
        handleStop: () => void,
        handleMove: (coords: { x: number, y: number }) => void,
        handleZoom: (change: number) => void
    }) {
    interactionState.handleStop = actions.handleStop;
    interactionState.handleMove = actions.handleMove;
    interactionState.handleZoom = actions.handleZoom;
}

function startIxn() {
    document.addEventListener('keydown', onKeyDownListener);
    document.addEventListener('mousemove', onMouseMoveListener);
}

function stopIxn() {
    document.removeEventListener('keydown', onKeyDownListener);
    document.removeEventListener('mousemove', onMouseMoveListener)
}

function onKeyDownListener(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        console.log('Esc key was pressed');
        interactionState.handleStop?.();
    }

    if (event.shiftKey) {
        switch (event.key) {
            case 'ArrowUp':
                console.log('Shift + Up key pressed');
                interactionState.handleZoom?.(1);
                break;
            case 'ArrowDown':
                console.log('Shift + Down key pressed');
                interactionState.handleZoom?.(-1);
                break;
        }
    }
}

function onMouseMoveListener(event: MouseEvent) {
    interactionState.handleMove?.({ x: event.pageX, y: event.pageY });
}

export default { registerIxnListeners, startIxn, stopIxn };
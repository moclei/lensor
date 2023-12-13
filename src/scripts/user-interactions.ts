type InteractionState = {
    handleStop: (() => void) | null;
    handleMove: ((coords: { x: number, y: number }) => void) | null;
}

const interactionState: InteractionState = {
    handleStop: null,
    handleMove: null
}

function registerIxnListeners(
    actions: {
        handleStop: () => void,
        handleMove: (coords: { x: number, y: number }) => void
    }) {
    interactionState.handleStop = actions.handleStop;
    interactionState.handleMove = actions.handleMove;
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
}

function onMouseMoveListener(event: MouseEvent) {
    interactionState.handleMove?.({ x: event.pageX, y: event.pageY });
}

export default { registerIxnListeners, startIxn, stopIxn };
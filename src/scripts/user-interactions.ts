type InteractionState = {
    handleStop: (() => void) | null;
    handleZoom: ((change: number) => void) | null;
    handleScroll: (() => void) | null;
}

const interactionState: InteractionState = {
    handleStop: null,
    handleZoom: null,
    handleScroll: null
}

let debounceTimeout: NodeJS.Timeout | null = null;
const debounceDelay = 300;
let initialScroll = true;
let lastScrollTop = 0;
let scrollDelta = 0;

function registerIxnListeners(
    actions: {
        handleStop: () => void,
        handleZoom: (change: number) => void,
        handleScroll: () => void
    }) {
    interactionState.handleStop = actions.handleStop;
    interactionState.handleZoom = actions.handleZoom;
    interactionState.handleScroll = actions.handleScroll;
    // Delay a little bit because opening the extension can trigger a scroll event.
    window.addEventListener('scroll', onScrollListener);
}

function startIxn() {
    document.addEventListener('keydown', onKeyDownListener);
}

function stopIxn() {
    document.removeEventListener('keydown', onKeyDownListener);
}

function onScrollListener(event: Event) {

    if (event.isTrusted) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollDelta += scrollTop - lastScrollTop;

        // console.log('Scroll Delta:', scrollDelta);

        lastScrollTop = scrollTop;
        if (scrollDelta > 1) {
            // console.log("Scroll event was trusted.")
            if (initialScroll || event.timeStamp < 10000) {
                initialScroll = false;
                return;
            }
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }

            debounceTimeout = setTimeout(() => {
                console.log("Scroll event debounced. Re capturing screen");
                scrollDelta = 0;
                interactionState.handleScroll?.();
            }, debounceDelay);
        }
    } else {
        console.log("Scroll event not trusted.")
    }
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
export default { registerIxnListeners, startIxn, stopIxn };
import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import Lense from './features/Lense';
import { connect, connected } from 'crann';
import { connect as porterConnect } from "porter-source";
import { LensorStateConfig } from "../weirwood/state-config";

console.log("Injected Lensor UI mounted");
const styles = {
    container: {
        shadow: {
            zIndex: '2147483647',
            display: 'block',
            visibility: 'visible',
            position: 'fixed',
            width: '100%',
            height: '100vh',
            top: '0',
            right: '0',
            overflow: 'hidden',
        },
        invisible: {
            visibility: 'hidden',
        }
    }
}

type LensorState = {
    mediaStreamId: string | null,
    active: boolean,
    shadowContainer: HTMLDivElement,
    shadowRoot: ShadowRoot | null,
    videoElement: HTMLVideoElement | null,
    offscreenCanvas: HTMLCanvasElement | null,
    scale: number,
    media: void | MediaStream | null,
    imageBitmap: ImageBitmap | null,
}
const state: LensorState = {
    mediaStreamId: null,
    active: false,
    shadowContainer: document.createElement('div'),
    shadowRoot: null,
    videoElement: null,
    scale: 1,
    media: null,
    offscreenCanvas: null,
    imageBitmap: null,
}


console.log('Lensor main container created');
const [post, setMessage] = porterConnect();

const [useCrann, get] = connect(LensorStateConfig);
const [active, setActive, onActive] = useCrann('active');
const [initialized, setInitialized, onInitialize] = useCrann('initialized');
const [mediaStreamId, setMediaStreamId, onMediaStreamChange] = useCrann('mediaStreamId');
onMediaStreamChange((mediaStreamId: string | null) => {
    console.log('handleMediaStreamChange, mediaStreamId: ', mediaStreamId);
    state.mediaStreamId = mediaStreamId;
    initializeIfReady();
});
onActive((active: boolean) => {
    console.log('handleActiveChange, active: ', active);
    state.active = active;
    initializeIfReady();
});
onInitialize(() => {
    console.log('handleInitializeChange, initialized: ', initialized);
    toggleShadowRootVisibility(true);
});


async function initializeIfReady() {
    const { active, mediaStreamId } = state;
    const { initialized } = get();
    console.log('initializeIfReady');
    if (active && mediaStreamId && !initialized) {
        console.log('initializeIfReady, initializeShadowRoot()');
        await getScreenImage(mediaStreamId);
    }
}

function initializeShadowRoot() {
    if (self === top) {
        console.log('initializeShadowRoot()')
        const { shadowContainer } = state;
        let { shadowRoot } = state;
        document.body.appendChild(shadowContainer);
        setStylesOnElement(shadowContainer, styles.container.shadow);
        shadowRoot = shadowContainer.attachShadow({ mode: 'closed' });

        const styleSlot = document.createElement('div');
        const fontStyle = document.createElement('style');

        shadowRoot.appendChild(styleSlot);
        shadowRoot.appendChild(fontStyle);

        const uiRoot = document.createElement('div');
        uiRoot.style.height = '100%';

        shadowRoot.appendChild(uiRoot);
        injectFontFace();

        if (styleSlot) {
            const root = createRoot(uiRoot);
            root.render(
                <StyleSheetManager target={styleSlot}>
                    <Lense imageBitmap={state.imageBitmap} active={true} onStop={handleLensorStop} onClose={handleLensorClose} />
                </StyleSheetManager>
            );
        }
        setInitialized(true);
    }
}

const toggleShadowRootVisibility = (visible: boolean) => {
    if (self === top) {
        console.log('toggleShadowRootVisibility()')
        if (state.shadowRoot) {
            let newStyle: Partial<CSSStyleDeclaration> = styles.container.shadow;
            if (!visible) {
                newStyle = { ...newStyle, ...styles.container.invisible };
            }
            setStylesOnElement(state.shadowContainer, newStyle);
        }
    }
};

async function getScreenImage(mediaStreamId: string | null) {
    if (mediaStreamId) {
        console.log('getScreenImage()');
        const media = await createMediaStream(mediaStreamId);
        if (!media) return;
        initializeImageCapture(media);
        state.media = media;
    }
}
function initializeImageCapture(media: MediaStream) {
    console.log('initializeImageCapture()')
    if (!state.videoElement) {
        console.log('initializeImageCapture(), creating video element')
        const videoElement = state.videoElement || document.createElement('video');
        videoElement.style.visibility = 'hidden';
        videoElement.style.position = 'absolute';
        videoElement.style.left = '-9999px';
        state.videoElement = videoElement;
        document.body.appendChild(state.videoElement);
        state.videoElement.addEventListener('loadedmetadata', (event) => {
            if (!state.videoElement) return;
            console.log("Video element loaded! event: ", event);
            const videoWidth = state.videoElement.videoWidth;
            state.scale = videoWidth / window.innerWidth;
        });
        state.videoElement.oncanplay = onImageCaptureBegin;
    }
    state.videoElement.srcObject = media;
    state.videoElement.play();
}
async function createMediaStream(streamId: string): Promise<MediaStream | null> {
    // console.log("initializeVideo");
    let media = null;
    try {
        // console.log("Trying to initialize video stream for streamId: ", streamId);
        media = await (navigator.mediaDevices as any).getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            }
        });
    } catch (recordException: any) {
        // console.log('error starting recording: ', recordException);
        media = null;
    }
    return media;
}
function onImageCaptureBegin() {
    console.log('onImageCaptureBegin');
    const { videoElement, media } = state;
    // const [initialized, setInitialized] = useCrann('initialized');
    if (!videoElement) return;
    console.log('onImageCaptureBegin, cropping region');
    const cropRegion = cropImage(videoElement.videoWidth, videoElement.videoHeight, window.innerWidth, window.innerHeight);

    const imageCapture = new ImageCapture(media!.getVideoTracks()[0]);
    imageCapture.grabFrame().then((imageBitmap) => {
        console.log('onImageCapture, imageBitmap: ', imageBitmap);
        media!.getVideoTracks()[0].stop();
        state.imageBitmap = imageBitmap;
        initializeShadowRoot();
    });
}

function cropImage
    (canvasWidth: number,
        canvasHeight: number,
        windowWidth: number,
        windowHeight: number
    ): { x: number, y: number, width: number, height: number } {
    // console.log("cropImage()");
    // console.log(`Crop image, canvasWidth: ${canvasWidth}, canvasHeight: ${canvasHeight}, windowWidth: ${windowWidth}, windowHeight: ${windowHeight}`)
    let scaleFactor, newWidth, newHeight;

    // Determine the dominant dimension
    if (windowWidth >= windowHeight) {
        // Width is dominant
        scaleFactor = canvasWidth / windowWidth;
        newWidth = canvasWidth;
        newHeight = windowHeight * scaleFactor;
    } else {
        // Height is dominant
        scaleFactor = canvasHeight / windowHeight;
        newHeight = canvasHeight;
        newWidth = windowWidth * scaleFactor;
    }

    // Calculate crop region
    const cropX = (canvasWidth - newWidth) / 2;
    const cropY = (canvasHeight - newHeight) / 2;

    return {
        x: cropX,
        y: cropY,
        width: newWidth,
        height: newHeight
    };
}


function handleLensorStop() {
    console.log('Handle lensor stop');
}

function handleLensorClose() {
    console.log('Handle lensor close');
}

function handlePopoverVisibility(show: boolean) {
    console.log('Handle popover visibility');
    if (state.shadowRoot) {
        let newStyles: Partial<CSSStyleDeclaration> = styles.container.shadow;
        if (!show) {
            newStyles = { ...newStyles, ...styles.container.invisible };
        }
        setStylesOnElement(state.shadowContainer, newStyles);
        return;
    }
}

function setStylesOnElement(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
    Object.assign(element.style, styles);
}

function injectFontFace() {
    // nothing to do here yet
}
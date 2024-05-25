
import { WeirwoodConnect, connect } from "weirwood";
import tabsManager from "../service-workers/tabs/tabs-manager";
import { assignCanvasProps } from "./canvas-utils";
import { makeDraggable } from "./draggable";
import interactions from "./user-interactions";
import { LensorStateConfig } from "../weirwood/state-config";
import { DerivedState } from "weirwood/dist/model/weirwood.model";
import FisheyeGl from "../lib/fisheyegl";

const BORDER_COLOR = 'rgb(87, 102, 111)';
const CANVAS_SIZE = 400;

const MainCanvasProps = {
    id: 'lensor-main-canvas',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    style: {
        position: 'fixed',
        zIndex: '9999998',
        right: '10px',
        top: '10px',
        borderRadius: '50%',
        border: `8px solid ${BORDER_COLOR}`,
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        imageRendering: 'pixelated',
        display: 'none'
    }
}

const IntermediaryCanvasProps = {
    id: 'lensor-intermediary-canvas',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    style: {
        position: 'fixed',
        zIndex: '9999998',
        right: '950px',
        top: '10px',
        borderRadius: '50%',
        border: `8px solid ${BORDER_COLOR}`,
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        imageRendering: 'pixelated',
        display: 'none'
    }
}

const FisheyeCanvasProps = {
    id: 'lensor-fisheye-canvas',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    style: {
        position: 'fixed',
        zIndex: '9999998',
        right: '500px',
        top: '10px',
        borderRadius: '50%',
        border: `8px solid ${BORDER_COLOR}`,
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        imageRendering: 'pixelated',
        display: 'none'
    }
}


const GridCanvasProps = {
    id: 'lensor-grid-canvas',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    style: {
        position: 'fixed',
        zIndex: '9999999',
        right: '18px',
        top: '18px',
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'none'
    }
}

type LensorState = {
    media: void | MediaStream | null,
    mouseX: number,
    mouseY: number,
    zoom: number,
    prevCoords: { x: number, y: number },
    videoElement: HTMLVideoElement | null,
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null,
    canvases: HTMLElement[],
    gridCtx: CanvasRenderingContext2D | null,
    gridCanvas: HTMLCanvasElement | null,
    infoCanvas: HTMLCanvasElement | null,
    handle: HTMLElement | null,
    infoCtx: CanvasRenderingContext2D | null,
    offscreenCtx: CanvasRenderingContext2D | null,
    offscreenCanvas: HTMLCanvasElement | null,
    fisheyeCanvas: HTMLCanvasElement | null,
    fisheyeCtx: CanvasRenderingContext2D | null,
    interCanvas: HTMLCanvasElement | null,
    interCtx: CanvasRenderingContext2D | null,
    initialized: boolean,
    scale: number,
    selectedPixelColor: string | null,
    myTabId: number | null,
    weirwood: WeirwoodConnect<typeof LensorStateConfig> | null,
    myStreamId: string | null,
    gridDrawn: boolean,
    interactionsStarted: boolean
}

const state: LensorState = {
    media: null,
    mouseX: 0,
    mouseY: 0,
    zoom: 2,
    prevCoords: { x: 0, y: 0 },
    videoElement: null,
    ctx: null,
    canvas: null,
    canvases: [],
    gridCtx: null,
    gridCanvas: null,
    gridDrawn: false,
    infoCtx: null,
    infoCanvas: null,
    offscreenCtx: null,
    offscreenCanvas: null,
    fisheyeCanvas: null,
    fisheyeCtx: null,
    interCanvas: null,
    interCtx: null,
    initialized: false,
    scale: 1,
    selectedPixelColor: null,
    myTabId: null,
    weirwood: null,
    myStreamId: null,
    handle: null,
    interactionsStarted: false
}

chrome.runtime.onMessage.addListener(async (message) => {
    console.log('runtime.onMessage, heard: ', message);
    switch (message.type) {
        case 'start-app':
            state.myTabId = message.tabId;
            state.myStreamId = message.data;
            // initApp(message.data);
            initInstance();
            break;
        case 'stop-app':
            stopRecording();
            break;
        default:
            console.log('Unrecognized message:', message.type);
    }
});

async function initInstance() {
    console.log("initInstance()");
    if (self === top && !state.initialized) {
        console.log("initInstance, we have creation!");
        const weirwood = connect(LensorStateConfig, "content_script");
        state.weirwood = weirwood;
        weirwood.subscribe(handleMediaStreamChange, ['mediaStreamId', 'active']);
    }
};

async function handleMediaStreamChange(changes: Partial<DerivedState<typeof LensorStateConfig>>) {
    console.log('handleMediaStreamChange, changes:', changes);
    const { mediaStreamId, active, initialized } = changes;
    if (mediaStreamId === null && !active && !initialized) {
        console.log("handleMediaStreamChange, Activating!");
        state.weirwood!.set({ active: true });
    }
    else if (mediaStreamId && state.myStreamId !== mediaStreamId) {
        console.log("handleMediaStreamChange, mediaStreamId changed")
        state.myStreamId = mediaStreamId;
        const media = await createMediaStream(mediaStreamId);
        if (!media) return;
        if (!state.canvas) createCanvases();
        if (!state.interactionsStarted) startInteractions();
        initializeImageCapture(media);
        state.media = media;
    }
}

async function createMediaStream(streamId: string): Promise<MediaStream | null> {
    console.log("initializeVideo");
    let media = null;
    try {
        console.log("Trying to initialize video stream for streamId: ", streamId);
        media = await (navigator.mediaDevices as any).getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            }
        });
    } catch (recordException: any) {
        console.log('error starting recording: ', recordException);
        media = null;
    }
    return media;
}


async function createCanvases() {
    console.log("createCanvases()");
    createMainCanvas();
    createIntermediaryCanvas();
    createHandle();
    createGridCanvas();
    drawCrosshairs();
    createOffscreenCanvas();
    createFisheyeCanvas();
    console.log("finished createCanvas()");
}
async function startInteractions() {
    interactions.registerIxnListeners({
        handleStop: () => {
            stopRecording();
        },
        handleZoom: (change: number) => {
            state.zoom += change;
            if (state.zoom < 1) state.zoom = 1;
            if (state.zoom > 6) state.zoom = 6;
        },
        handleScroll: () => {
            console.log('scroll handler called');
            showCanvases(false);
            setTimeout(() => {
                state.weirwood!.set({ mediaStreamId: null });
            }, 500);

        },
    });
    interactions.startIxn();
    makeDraggable(state.handle!, [state.gridCanvas!, state.canvas!], 8, (coords: { x: number, y: number }) => {
        state.mouseX = coords.x;
        state.mouseY = coords.y;
    });
    state.interactionsStarted = true;
}
// Version 2 of createAndStartVideoElement
function initializeImageCapture(media: MediaStream) {
    console.log('initializeImageCapture()')
    if (!state.videoElement) {
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
            if (!state.gridDrawn) {
                drawGrid(state.scale * state.zoom);
                state.gridDrawn = true;
            }
        });
        state.videoElement.oncanplay = onImageCaptureBegin;
    }
    state.videoElement.srcObject = media;
    state.videoElement.play();
}

function onImageCaptureBegin() {
    console.log('onImageCaptureBegin');
    const { ctx, videoElement, offscreenCtx, offscreenCanvas, media } = state;
    if (!ctx || !videoElement || !offscreenCtx || !offscreenCanvas) return;

    const cropRegion = cropImage(videoElement.videoWidth, videoElement.videoHeight, window.innerWidth, window.innerHeight);
    offscreenCanvas.height = videoElement.videoHeight;
    offscreenCanvas.width = videoElement.videoWidth;
    offscreenCtx.drawImage(videoElement, cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height, 0, 0, cropRegion.width, cropRegion.height);
    // console.log(offScreenCtx);
    state.initialized = true;
    media!.getVideoTracks()[0].stop();
    showCanvases(true);
    console.log('onImageCapture finished. Setting initialized to true.');
    state.weirwood!.set({ initialized: true });
}

async function stopRecording() {
    console.log('stopRecording()');
    const { canvas, ctx, gridCtx, gridCanvas, videoElement, media } = state;
    tabsManager.setTabRecording(state.myTabId!, false);
    media!.getVideoTracks()[0].stop();
    !!videoElement && videoElement.remove();
    state.videoElement = null;
    state.media = null;
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.remove();
        state.ctx = null;
        state.canvas = null;
    }
    if (gridCtx && gridCanvas) {
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
        gridCanvas.remove();
        state.gridCtx = null;
        state.gridCanvas = null;
    }
    if (state.handle) {
        document.body.removeChild(state.handle);
        state.handle = null;
    }
    interactions.stopIxn();
    state.weirwood!.set({ active: false, mediaStreamId: null });
}

// Called every frame.. Could be optimized to only call on mouse move, or image capture
function updateCanvas() {
    const { canvas, ctx, offscreenCanvas, videoElement, initialized, scale, mouseX, mouseY } = state;
    if (!videoElement || !ctx || !canvas || !offscreenCanvas || !initialized) {
        console.log("updateCanvas skipped, initialized: ", initialized);
        return;
    }
    if (initialized) {

        // Draw the distorted image onto the fisheye canvas
        // state.ctx!.drawImage(fisheyeImage, 0, 0, state.canvas!.width, state.canvas!.height);
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const canvasXAdjust = CANVAS_SIZE / (state.zoom * 2);
        const canvasYAdjust = CANVAS_SIZE / (state.zoom * 2);

        const cropX = (mouseX * scale) - canvasXAdjust;
        const cropY = (mouseY * scale) - canvasYAdjust;

        ctx.drawImage(offscreenCanvas, cropX, cropY, CANVAS_SIZE / state.zoom, CANVAS_SIZE / state.zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

        updateSelectedPixel();
    }
    requestAnimationFrame(updateCanvas);
}

// Called every frame.. Could be optimized to only call on mouse move, or image capture
let image: HTMLImageElement;
let distorter: any;
function updateCanvas2() {
    const { canvas, ctx, fisheyeCanvas, offscreenCanvas, interCanvas, interCtx, videoElement, initialized, scale, mouseX, mouseY } = state;
    if (!videoElement || !ctx || !canvas || !interCanvas || !interCtx || !offscreenCanvas || !fisheyeCanvas || !initialized) {
        console.log("updateCanvas skipped, initialized: ", initialized);
        return;
    }
    if (initialized && !distorter) {
        distorter = FisheyeGl({
            selector: '#lensor-fisheye-canvas',
            lens: {
                a: 1,    // 0 to 4;  default 1
                b: 1,    // 0 to 4;  default 1
                Fx: 0.15, // 0 to 4;  default 0.0
                Fy: 0.15, // 0 to 4;  default 0.0
                scale: 1 // 0 to 20; default 1.5
            },
            fov: {
                x: 1, // 0 to 2; default 1
                y: 1  // 0 to 2; default 1
            },
        });
    }
    if (initialized) {

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        interCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const canvasXAdjust = CANVAS_SIZE / (state.zoom * 2);
        const canvasYAdjust = CANVAS_SIZE / (state.zoom * 2);

        const cropX = (mouseX * scale) - canvasXAdjust;
        const cropY = (mouseY * scale) - canvasYAdjust;

        interCtx.drawImage(offscreenCanvas, cropX, cropY, CANVAS_SIZE / state.zoom, CANVAS_SIZE / state.zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        // fisheyeCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        // fisheyeCtx.drawImage(offscreenCanvas, cropX, cropY, CANVAS_SIZE / state.zoom, CANVAS_SIZE / state.zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const fisheyeImageDataUrl = interCanvas.toDataURL();
        if (!image) {
            image = new Image();
            image.src = fisheyeImageDataUrl;
            const imageWindow = document.getElementById('image-window');
            // imageWindow!.style.backgroundImage = 'url(' + distorter.getCanvasDataUrl() + ')';
            imageWindow!.style.backgroundImage = 'url(' + image.src + ')';
        }
        // image.src = fisheyeImageDataUrl;
        // const imageWindow = document.getElementById('image-window');
        // image.onload = function () {
        // Initialize fisheyeGl with the loaded image
        distorter.setImage(fisheyeImageDataUrl);
        // distorter.run();
        // const fisheyeImage = distorter.getCanvasDataUrl();

        ctx.drawImage(distorter.getCanvas(), 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        // };
        updateSelectedPixel();
    }
    requestAnimationFrame(updateCanvas2);
}

function updateSelectedPixel() {
    //console.log("updateSelectedPixel()");
    const { prevCoords, mouseX, mouseY } = state;
    if (mouseX !== prevCoords.x || mouseY !== prevCoords.y) {
        state.prevCoords = { x: mouseX, y: mouseY };
        const pixel = state.ctx!.getImageData(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 1, 1);
        const rgb = `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
        state.selectedPixelColor = rgb;
        state.canvas!.style.border = `8px solid ${rgb}`;
        state.handle!.style.setProperty('--before-background-color', rgb);
    }
}

function showCanvases(visible: boolean) {
    console.log("showCanvases(", visible, ")");

    if (visible) {
        for (let canvas of state.canvases) {
            canvas!.style.display = 'block';
            canvas!.style.visibility = 'visible';
            updateCanvas2();
        }
    } else {
        for (let canvas of state.canvases) {
            canvas!.style.display = 'none';
            canvas!.style.visibility = 'hidden';
        }
    }

}

function createMainCanvas() {
    console.log("createMainCanvas()");
    const canvas = document.createElement('canvas');
    assignCanvasProps(canvas, MainCanvasProps);
    document.body.appendChild(canvas);
    state.ctx = canvas.getContext('2d');
    state.canvas = canvas;
    state.canvases.push(canvas);
}


function createFisheyeCanvas() {
    console.log("createFisheyeCanvas()");
    const fisheyeCanvas = document.createElement('canvas');
    assignCanvasProps(fisheyeCanvas, FisheyeCanvasProps);
    document.body.appendChild(fisheyeCanvas);
    state.fisheyeCanvas = fisheyeCanvas;
    // state.fisheyeCtx = fisheyeCanvas.getContext('2d');
    state.canvases.push(fisheyeCanvas);
}

function createIntermediaryCanvas() {
    console.log("createMainCanvas()");
    const canvas = document.createElement('canvas');
    assignCanvasProps(canvas, IntermediaryCanvasProps);
    document.body.appendChild(canvas);
    state.interCtx = canvas.getContext('2d');
    state.interCanvas = canvas;
    state.canvases.push(canvas);
}

function createOffscreenCanvas() {
    console.log("createOffscreenCanvas()");
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.id = 'lensor-offscreen-canvas';
    offscreenCanvas.style.visibility = 'hidden';
    offscreenCanvas.style.position = 'absolute';
    offscreenCanvas.style.left = '-9999px';
    offscreenCanvas.style.imageRendering = 'pixelated';
    document.body.appendChild(offscreenCanvas);
    state.offscreenCanvas = offscreenCanvas;
    state.offscreenCtx = offscreenCanvas.getContext('2d');
}

function createHandle() {
    console.log("createHandle()");
    const handle = document.createElement('div');
    handle.id = 'lensor-handle';
    document.body.appendChild(handle);
    state.handle = handle;
    state.canvases.push(handle);

    console.log("createImageWindow()");
    const imageWindow = document.createElement('div');
    imageWindow.id = 'image-window';
    document.body.appendChild(imageWindow);
}

function createGridCanvas() {
    console.log("createGridCanvas()");
    const gridCanvas = document.createElement('canvas');
    assignCanvasProps(gridCanvas, GridCanvasProps);
    document.body.appendChild(gridCanvas);
    state.gridCanvas = gridCanvas;
    state.gridCtx = gridCanvas.getContext('2d');
    state.canvases.push(gridCanvas);
}

function drawGrid(spacing: number) {
    console.log("drawGrid()");
    const { gridCtx, gridCanvas } = state;
    if (!gridCtx || !gridCanvas) return;
    gridCtx.strokeStyle = '#000000'; // Grid line color
    gridCtx.lineWidth = .5;
    gridCtx.beginPath();

    // Vertical lines
    for (let x = 0; x <= gridCanvas.width; x += spacing) {
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
    }

    // Horizontal lines
    for (let y = 0; y <= gridCanvas.height; y += spacing) {
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(gridCanvas.width, y);
    }

    gridCtx.stroke();
}

function drawCrosshairs() {
    console.log("drawCrosshairs()");
    const { gridCtx, gridCanvas } = state;
    if (!gridCtx || !gridCanvas) return;

    const crosshairColor = 'black';
    const crosshairWidth = 2;
    const crosshairLength = 20;


    // Calculate the center coordinates
    const centerX = gridCanvas.width / 2;
    const centerY = gridCanvas.height / 2;

    gridCtx.save();

    // Set the line style for the crosshairs
    gridCtx.strokeStyle = crosshairColor;
    gridCtx.lineWidth = crosshairWidth;

    // Draw the horizontal line
    gridCtx.beginPath();
    gridCtx.moveTo(centerX - crosshairLength / 2, centerY);
    gridCtx.lineTo(centerX + crosshairLength / 2, centerY);
    gridCtx.stroke();

    // Draw the vertical line
    gridCtx.beginPath();
    gridCtx.moveTo(centerX, centerY - crosshairLength / 2);
    gridCtx.lineTo(centerX, centerY + crosshairLength / 2);
    gridCtx.stroke();

    // Restore the canvas state
    gridCtx.restore();
}

function saveAsPNG(canvas: HTMLCanvasElement) {
    const dataURL = canvas.toDataURL();

    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    const formattedDate = formatDateTime(new Date());
    downloadLink.download = `canvas-image-${formattedDate}.png`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function formatDateTime(date: Date): string {
    console.log("formatDateTime()");
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day}_${hours}-${minutes}`;
}

function cropImage
    (canvasWidth: number,
        canvasHeight: number,
        windowWidth: number,
        windowHeight: number
    ): { x: number, y: number, width: number, height: number } {
    console.log("cropImage()");
    console.log(`Crop image, canvasWidth: ${canvasWidth}, canvasHeight: ${canvasHeight}, windowWidth: ${windowWidth}, windowHeight: ${windowHeight}`)
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

import tabsManager from "../service-workers/tabs/tabs-manager";
import { assignCanvasProps } from "./canvas-utils";
import { makeDraggable } from "./draggable";
import interactions from "./user-interactions";

chrome.runtime.onMessage.addListener(async (message) => {
    console.log('runtime.onMessage, heard: ', message);
    switch (message.type) {
        case 'start-recording':
            startRecording(message.data);
            state.myTabId = message.tabId;
            break;
        case 'stop-recording':
            stopRecording();
            break;
        default:
            console.log('Unrecognized message:', message.type);
    }
});

const BORDER_COLOR = 'rgb(87, 102, 111)';
const CANVAS_SIZE = 400;

const InfoCanvasProps = {
    width: 80,
    height: 40,
    style: {
        position: 'fixed',
        zIndex: '9999999',
        backgroundColor: 'lightyellow',
        right: '10px',
        top: '410px',
        borderRadius: '6px',
        border: `0px`,
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
        display: 'none'
    }
}

const MainCanvasProps = {
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

const GridCanvasProps = {
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
    canvases: HTMLCanvasElement[],
    gridCtx: CanvasRenderingContext2D | null,
    gridCanvas: HTMLCanvasElement | null,
    infoCanvas: HTMLCanvasElement | null,
    infoCtx: CanvasRenderingContext2D | null,
    offscreenCtx: CanvasRenderingContext2D | null,
    offscreenCanvas: HTMLCanvasElement | null,
    initialized: boolean,
    scale: number,
    selectedPixelColor: string | null,
    myTabId: number | null
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
    infoCtx: null,
    infoCanvas: null,
    offscreenCtx: null,
    offscreenCanvas: null,
    initialized: false,
    scale: 1,
    selectedPixelColor: null,
    myTabId: null
}

interactions.registerIxnListeners({
    handleStop: () => {
        stopRecording();
    },
    handleMove: (coords: { x: number, y: number }) => {
        state.mouseX = coords.x;
        state.mouseY = coords.y;
    },
    handleZoom: (change: number) => {
        state.zoom += change;
        if (state.zoom < 1) state.zoom = 1;
        if (state.zoom > 6) state.zoom = 6;
    }
});

function createAndStartVideoElement(media: MediaStream) {
    const videoElement = document.createElement('video');

    videoElement.addEventListener('loadedmetadata', () => {
        if (!videoElement) return;
        console.log("Video element loaded!");
        const videoWidth = videoElement.videoWidth;
        // const videoHeight = videoElement.videoHeight;
        state.scale = videoWidth / window.innerWidth;
        // scaleY = videoHeight / window.innerHeight;
        drawGrid(state.scale * state.zoom);

    });

    videoElement.style.visibility = 'hidden';
    videoElement.style.position = 'absolute';
    videoElement.style.left = '-9999px';
    document.body.appendChild(videoElement);

    state.videoElement = videoElement;

    // Set the stream as the source for the video element
    videoElement.srcObject = media;
    videoElement.play();
    videoElement.oncanplay = onRecordingStarted;
}

function onRecordingStarted() {
    console.log('onRecordingStarted');
    const { ctx, videoElement, offscreenCtx, offscreenCanvas, media } = state;
    if (!ctx || !videoElement || !offscreenCtx || !offscreenCanvas) return;

    const cropRegion = cropImage(videoElement.videoWidth, videoElement.videoHeight, window.innerWidth, window.innerHeight);

    offscreenCanvas.height = videoElement.videoHeight;
    offscreenCanvas.width = videoElement.videoWidth;
    offscreenCtx.drawImage(videoElement, cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height, 0, 0, cropRegion.width, cropRegion.height);
    state.initialized = true;
    updateCanvas();
    media!.getVideoTracks()[0].stop();
    showCanvases();
}

async function startRecording(streamId: string) {
    console.log("startRecording, streamId:", streamId);
    try {
        state.media = await (navigator.mediaDevices as any).getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            }
        });
    } catch (recordException: any) {
        console.log('error starting recording: ', recordException);
        state.media = null;
    }
    if (!state.media) return;
    createMainCanvas();
    createInfoCanvas();
    createGridCanvas();
    createOffscreenCanvas();
    createAndStartVideoElement(state.media);
    interactions.startIxn();
    makeDraggable(state.canvas!, [state.gridCanvas!, state.infoCanvas!], 8);
    tabsManager.setTabRecording(state.myTabId!, true);
}

async function stopRecording() {
    console.log('stopRecording');
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
    interactions.stopIxn();
}

function updateCanvas() {
    const { canvas, ctx, offscreenCanvas, videoElement, initialized, scale, mouseX, mouseY } = state;
    if (!videoElement || !ctx || !canvas || !offscreenCanvas || !initialized) {
        console.log("updateCanvas skipped, initialized: ", initialized);
        return;
    }
    if (initialized) {
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

function updateSelectedPixel() {
    const { prevCoords, mouseX, mouseY } = state;
    if (mouseX !== prevCoords.x || mouseY !== prevCoords.y) {
        state.prevCoords = { x: mouseX, y: mouseY };
        const pixel = state.ctx!.getImageData(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 1, 1);
        const rgb = `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
        state.selectedPixelColor = rgb;
        state.canvas!.style.border = `8px solid ${rgb}`;
    }
}

function createMainCanvas() {
    const canvas = document.createElement('canvas');
    assignCanvasProps(canvas, MainCanvasProps);
    document.body.appendChild(canvas);
    state.ctx = canvas.getContext('2d');
    state.canvas = canvas;
    state.canvases.push(canvas);
}

function createInfoCanvas() {
    const infoCanvas = document.createElement('canvas');
    assignCanvasProps(infoCanvas, InfoCanvasProps);
    document.body.appendChild(infoCanvas);
    state.infoCtx = infoCanvas.getContext('2d');
    state.infoCanvas = infoCanvas;
    state.canvases.push(infoCanvas);
}

function createGridCanvas() {
    const gridCanvas = document.createElement('canvas');
    assignCanvasProps(gridCanvas, GridCanvasProps);
    document.body.appendChild(gridCanvas);
    state.gridCanvas = gridCanvas;
    state.gridCtx = gridCanvas.getContext('2d');
    state.canvases.push(gridCanvas);
}

function showCanvases() {
    for (let canvas of state.canvases) {
        canvas!.style.display = 'block';
    }
}

function createOffscreenCanvas() {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.style.visibility = 'hidden';
    offscreenCanvas.style.position = 'absolute';
    offscreenCanvas.style.left = '-9999px';
    offscreenCanvas.style.imageRendering = 'pixelated';
    document.body.appendChild(offscreenCanvas);
    state.offscreenCanvas = offscreenCanvas;
    state.offscreenCtx = offscreenCanvas.getContext('2d');
}

function drawGrid(spacing: number) {
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

import { makeDraggable } from "./draggable";
import interactions from "./user-interactions";

chrome.runtime.onMessage.addListener(async (message) => {
    console.log('runtime.onMessage, heard: ', message);
    switch (message.type) {
        case 'start-recording':
            startRecording(message.data);
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
const ZOOM = 6;

type LensorState = {
    media: void | MediaStream | null,
    mouseX: number,
    mouseY: number,
    prevCoords: { x: number, y: number },
    videoElement: HTMLVideoElement | null,
    ctx: CanvasRenderingContext2D | null,
    canvas: HTMLCanvasElement | null,
    gridCtx: CanvasRenderingContext2D | null,
    gridCanvas: HTMLCanvasElement | null,
    dragCanvas: HTMLCanvasElement | null,
    dragCtx: CanvasRenderingContext2D | null,
    offscreenCtx: CanvasRenderingContext2D | null,
    offscreenCanvas: HTMLCanvasElement | null,
    initialized: boolean,
    scale: number,
    selectedPixelColor: string | null
}
const state: LensorState = {
    media: null,
    mouseX: 0,
    mouseY: 0,
    prevCoords: { x: 0, y: 0 },
    videoElement: null,
    ctx: null,
    canvas: null,
    gridCtx: null,
    gridCanvas: null,
    dragCtx: null,
    dragCanvas: null,
    offscreenCtx: null,
    offscreenCanvas: null,
    initialized: false,
    scale: 1,
    selectedPixelColor: null
}

interactions.registerIxnListeners({
    handleStop: () => {
        stopRecording();
    },
    handleMove: (coords: { x: number, y: number }) => {
        state.mouseX = coords.x;
        state.mouseY = coords.y;
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
        drawGrid(state.scale * ZOOM);

    });

    videoElement.style.visibility = 'hidden';
    videoElement.style.position = 'absolute';
    videoElement.style.left = '-9999px';
    document.body.appendChild(videoElement);

    state.videoElement = videoElement;

    // Set the stream as the source for the video element
    videoElement.srcObject = media;
    videoElement.play();
    videoElement.oncanplay = () => {
        console.log('onCanPlay');
        const { ctx, videoElement, offscreenCtx, offscreenCanvas, media } = state;
        if (!ctx || !videoElement || !offscreenCtx || !offscreenCanvas) return;

        offscreenCanvas.height = videoElement.videoHeight;
        offscreenCanvas.width = videoElement.videoWidth;
        offscreenCtx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
        // saveAsPNG(offscreenCanvas);
        state.initialized = true;
        updateCanvas();
        media!.getVideoTracks()[0].stop();
        showCanvases();
    }
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
    createGridCanvas();
    createOffscreenCanvas();
    createAndStartVideoElement(state.media);
    interactions.startIxn();
    makeDraggable(state.canvas!, [state.gridCanvas!], 8);
    chrome.storage.local.set({ recording: true });
}

async function stopRecording() {
    console.log('stopRecording');
    const { canvas, ctx, gridCtx, gridCanvas, videoElement, media } = state;
    chrome.storage.local.set({ recording: false });
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

        const canvasXAdjust = 28;
        const canvasYAdjust = 9;

        const cropX = (mouseX * scale) - canvasXAdjust;
        const cropY = (mouseY * scale) - canvasYAdjust;

        ctx.drawImage(offscreenCanvas, cropX, cropY, CANVAS_SIZE / ZOOM, CANVAS_SIZE / ZOOM, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

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
        console.log("updating pixel color: ", rgb);
        state.selectedPixelColor = rgb;
        state.canvas!.style.border = `8px solid ${rgb}`;
    }
}

function createMainCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    canvas.style.position = 'fixed';
    canvas.style.zIndex = '9999998';
    // canvas.style.pointerEvents = 'none';
    canvas.style.right = `10px`;
    canvas.style.top = `10px`;
    canvas.style.borderRadius = '50%';
    canvas.style.border = `8px solid ${BORDER_COLOR}`;
    canvas.style.overflow = 'hidden';
    canvas.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    state.ctx = canvas.getContext('2d');
    state.canvas = canvas;
}

function createGridCanvas() {
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = CANVAS_SIZE;
    gridCanvas.height = CANVAS_SIZE;
    gridCanvas.style.position = 'fixed';
    gridCanvas.style.zIndex = '9999999';
    gridCanvas.style.pointerEvents = 'none'; // To allow clicking 'through' the canvas
    gridCanvas.style.right = `18px`;
    gridCanvas.style.top = `18px`;
    gridCanvas.style.borderRadius = '50%';
    gridCanvas.style.overflow = 'hidden';
    gridCanvas.style.display = 'none';
    document.body.appendChild(gridCanvas);
    state.gridCanvas = gridCanvas;
    state.gridCtx = gridCanvas.getContext('2d');
}

function showCanvases() {
    state.gridCanvas!.style.display = 'block';
    state.canvas!.style.display = 'block';
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

    // Draw vertical lines
    for (let x = 0; x <= gridCanvas.width; x += spacing) {
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
    }

    // Draw horizontal lines
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
    downloadLink.download = 'canvas-image.png';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

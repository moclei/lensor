
// import { WeirwoodConnect, connect } from "weirwood";
import { connect, connected } from 'crann';
import tabsManager from "../service-workers/tabs/tabs-manager";
import { assignCanvasProps } from "./canvas-utils";
import { makeDraggable } from "./draggable";
import interactions from "./user-interactions";
import { LensorStateConfig } from "../weirwood/state-config";
import { DerivedState } from "weirwood/dist/model/weirwood.model";
import FisheyeGl, { Fisheye } from "../lib/fisheyegl";
import { observeDOMChanges } from "./observable";
import { loadHtmlTemplate } from './utils/template-loader';
import { connect as porterConnect } from "porter-source";

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
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
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
        left: '-10950px',
        top: '10px',
        borderRadius: '50%',
        border: `8px solid ${BORDER_COLOR}`,
        overflow: 'hidden',
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
        left: '-10500px',
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
        display: 'none',
        boxShadow: 'rgb(0, 0, 0) 0px 0px 16px inset'
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
    ringHandle: HTMLElement | null,
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
    // weirwood: WeirwoodConnect<typeof LensorStateConfig> | null,
    myStreamId: string | null,
    gridDrawn: boolean,
    interactionsStarted: boolean
    distorter: Fisheye | null,
    buttonContainer: HTMLElement | null,
    buttonSegment: HTMLElement | null,
    infoScroll: HTMLElement | null,
    toggleGridInput: HTMLElement | null,
    toggleFisheyeInput: HTMLElement | null,
    gridOn: boolean,
    fisheyeOn: boolean
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
    myStreamId: null,
    handle: null,
    ringHandle: null,
    interactionsStarted: false,
    distorter: null,
    buttonContainer: null,
    buttonSegment: null,
    infoScroll: null,
    toggleGridInput: null,
    toggleFisheyeInput: null,
    gridOn: true,
    fisheyeOn: true
}

console.log('ContentScript loaded!');
if (self === top) {
    console.log('Self was top, connecting to porter');
    const [post, setMessage] = porterConnect();
    setMessage({
        'hello': (message) => {
            console.log('Lensor ContentSCript, Received hello message: ', message);
            post({ action: 'hello_back', payload: 'from content script' });
        },
        'action-clicked': (message, agent) => {
            console.log('Lensor ContentScript, action-clicked heard!');
            if (self === top) {
                console.log("Lensor initialize");
                setInitialized(true);
            }
        }
    });
}

// chrome.runtime.onMessage.addListener(async (message) => {
//     // console.log('runtime.onMessage, heard: ', message);
//     switch (message.type) {
//         case 'start-app':
//             state.myTabId = message.tabId;
//             state.myStreamId = message.data;
//             // initApp(message.data);
//             initInstance();
//             break;
//         case 'stop-app':
//             stopRecording();
//             break;
//         default:
//             console.log('Unrecognized message:', message.type);
//     }
// });
const [useCrann, get] = connect(LensorStateConfig);
const [active, setActive] = useCrann('active');
const [initialized, setInitialized] = useCrann('initialized');
const [mediaStreamId, setMediaStreamId, onMediaStreamChange] = useCrann('mediaStreamId');
onMediaStreamChange(handleMediaStreamChange);

async function handleMediaStreamChange(mediaStreamId: string | null) {
    console.log('handleMediaStreamChange, mediaStreamId: ', mediaStreamId);
    if (!mediaStreamId && !active && !initialized) {
        setActive(true)
    }
    else if (mediaStreamId) {
        const media = await createMediaStream(mediaStreamId);
        if (!media) return;
        if (!state.canvas) await createCanvases();
        if (!state.interactionsStarted) startInteractions();
        initializeImageCapture(media);
        state.media = media;
    }
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

async function createCanvases() {
    // console.log("createCanvases()");
    createMainCanvas();
    createIntermediaryCanvas();
    // Create button after handle
    createHandle();
    await createButton();
    createGridCanvas();
    drawCrosshairs();
    createOffscreenCanvas();
    createFisheyeCanvas();
    observeDOMChanges((changeScore: number) => {
        // console.log("DOM changed! Score was: ", changeScore);
    });
    // console.log("finished createCanvas()");
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
            // const [_, setMediaStreamId] = useCrann('mediaStreamId');
            // console.log('scroll handler called');
            showCanvases(false);
            setTimeout(() => {
                setMediaStreamId(null);
            }, 500);
        },
    });
    interactions.startIxn();
    makeDraggable(state.ringHandle!, [state.gridCanvas!, state.canvas!, state.infoScroll!], 8, (coords: { x: number, y: number }) => {
        state.mouseX = coords.x;
        state.mouseY = coords.y;
    }, updateCanvas);
    state.interactionsStarted = true;
}

function initializeImageCapture(media: MediaStream) {
    // console.log('initializeImageCapture()')
    if (!state.videoElement) {
        const videoElement = state.videoElement || document.createElement('video');
        videoElement.style.visibility = 'hidden';
        videoElement.style.position = 'absolute';
        videoElement.style.left = '-9999px';
        state.videoElement = videoElement;
        document.body.appendChild(state.videoElement);
        state.videoElement.addEventListener('loadedmetadata', (event) => {
            if (!state.videoElement) return;
            // console.log("Video element loaded! event: ", event);
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
    // console.log('onImageCaptureBegin');
    const { ctx, videoElement, offscreenCtx, offscreenCanvas, media } = state;
    // const [initialized, setInitialized] = useCrann('initialized');
    if (!ctx || !videoElement || !offscreenCtx || !offscreenCanvas) return;

    const cropRegion = cropImage(videoElement.videoWidth, videoElement.videoHeight, window.innerWidth, window.innerHeight);
    offscreenCanvas.height = videoElement.videoHeight;
    offscreenCanvas.width = videoElement.videoWidth;
    offscreenCtx.drawImage(videoElement, cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height, 0, 0, cropRegion.width, cropRegion.height);
    // // console.log(offScreenCtx);
    state.initialized = true;
    media!.getVideoTracks()[0].stop();
    showCanvases(true);
    // console.log('onImageCapture finished. Setting initialized to true.');
    setInitialized(true);
}

async function stopRecording() {
    // console.log('stopRecording()');
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
    if (state.ringHandle) {
        document.body.removeChild(state.ringHandle);
        state.ringHandle = null;
    }
    interactions.stopIxn();
    setActive(false);
    setMediaStreamId(null);
    // state.weirwood!.set({ active: false, mediaStreamId: null });
}

function updateCanvas() {
    const { canvas, ctx, fisheyeCanvas, offscreenCanvas, interCanvas, interCtx, videoElement, initialized, scale, mouseX, mouseY } = state;
    if (!videoElement || !ctx || !canvas || !interCanvas || !interCtx || !offscreenCanvas || !fisheyeCanvas || !initialized) {
        // console.log("updateCanvas skipped, initialized: ", initialized);
        return Date.now();
    }
    if (initialized && !state.distorter) {
        // console.log("Initializing distorter!")
        state.distorter = FisheyeGl({
            selector: '#lensor-fisheye-canvas',
            lens: {
                a: 1,    // 0 to 4;  default 1
                b: 1,    // 0 to 4;  default 1
                Fx: -0.15, // 0 to 4;  default 0.0
                Fy: -0.15, // 0 to 4;  default 0.0
                scale: 1.05 // 0 to 20; default 1.5
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

        if (state.fisheyeOn) {
            interCtx.drawImage(offscreenCanvas, cropX, cropY, CANVAS_SIZE / state.zoom, CANVAS_SIZE / state.zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const fisheyeImageDataUrl = interCanvas.toDataURL();

            state.distorter!.setImage(fisheyeImageDataUrl);
            ctx.drawImage(state.distorter!.getCanvas(), 0, 0);
        } else {
            ctx.drawImage(offscreenCanvas, cropX, cropY, CANVAS_SIZE / state.zoom, CANVAS_SIZE / state.zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }

        updateSelectedPixel();
    }
    return Date.now();
}

function updateSelectedPixel() {
    const { prevCoords, mouseX, mouseY } = state;
    if (mouseX !== prevCoords.x || mouseY !== prevCoords.y) {
        state.prevCoords = { x: mouseX, y: mouseY };
        const pixel = state.ctx!.getImageData(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 1, 1);
        const rgb = `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
        state.selectedPixelColor = rgb;
        state.canvas!.style.border = `8px solid ${rgb}`;
        state.ringHandle!.style.setProperty('--before-background-color', rgb);
    }
}

function showCanvases(visible: boolean) {
    // console.log("showCanvases(", visible, ")");
    if (visible) {
        for (let canvas of state.canvases) {
            canvas!.style.display = 'block';
            canvas!.style.visibility = 'visible';
        }
        updateCanvas();
    } else {
        for (let canvas of state.canvases) {
            canvas!.style.display = 'none';
            canvas!.style.visibility = 'hidden';
        }
    }
}

function createMainCanvas() {
    // console.log("createMainCanvas()");
    const canvas = document.createElement('canvas');
    assignCanvasProps(canvas, MainCanvasProps);
    document.body.appendChild(canvas);
    state.ctx = canvas.getContext('2d');
    state.canvas = canvas;
    state.canvases.push(canvas);
}


function createFisheyeCanvas() {
    // console.log("createFisheyeCanvas()");
    const fisheyeCanvas = document.createElement('canvas');
    assignCanvasProps(fisheyeCanvas, FisheyeCanvasProps);
    document.body.appendChild(fisheyeCanvas);
    state.fisheyeCanvas = fisheyeCanvas;
    // state.fisheyeCtx = fisheyeCanvas.getContext('2d');
    state.canvases.push(fisheyeCanvas);
}


async function createButton() {
    const buttonSegment = document.createElement('div');
    const buttonSegmentImage = document.createElement('div');
    const infoScroll = document.createElement('div');
    infoScroll.className = 'info-scroll';
    buttonSegment.id = "lensor-btn-segment";
    buttonSegment.className = 'button-segment';
    buttonSegmentImage.id = "lensor-btn-segment-img";
    buttonSegmentImage.className = 'button-segment-img';
    buttonSegment.appendChild(buttonSegmentImage);

    state.ringHandle!.appendChild(buttonSegment);
    document.body.appendChild(infoScroll);

    await loadHtmlTemplate('toggle-switch', infoScroll);
    state.toggleGridInput = document.getElementById('toggle-grid') as HTMLInputElement;
    if (state.toggleGridInput) {
        state.toggleGridInput!.addEventListener('click', () => {
            state.gridOn = !state.gridOn;
            drawGrid(state.scale * state.zoom);
        })
    } else {
        // console.log("No toggle grid input!");
    }

    state.toggleFisheyeInput = document.getElementById('toggle-fisheye') as HTMLInputElement;
    if (state.toggleFisheyeInput) {
        state.toggleFisheyeInput!.addEventListener('click', () => {
            state.fisheyeOn = !state.fisheyeOn;
        })
    } else {
        // console.log("No toggle grid input!");
    }


    state.buttonSegment = buttonSegment;
    state.infoScroll = infoScroll;

    buttonSegmentImage.addEventListener('click', () => {
        // console.log("buttonSegmentImage clicked!")
        if (infoScroll.classList.contains('open')) {
            state.infoScroll!.classList.remove('open');
        } else {
            state.infoScroll!.classList.add('open');
        }
    });


    // const ctx = buttonCanvas.getContext("2d");
    // const w = buttonCanvas.width = 200;
    // const h = buttonCanvas.height = 200;

    // const noiseSpeed = 0.005;
    // const noiseScale = 100;
    // const dotSize = 4;
    // const gap = 1;
    // const hueBase = 200;
    // const hueRange = 60;
    // const shape = 0;

    // function draw() {
    //     let nt = 0;
    //     for (let x = 0; x < w; x += dotSize + gap) {
    //         for (let y = 0; y < h; y += dotSize + gap) {
    //             const noise = mkSimplexNoise(Math.random);
    //             const yn = (noise.noise3D(y / noiseScale, x / noiseScale, nt) as number) * 20;
    //             const cn = lerp(hueRange, yn * hueRange, 0.2);

    //             ctx!.beginPath();
    //             ctx!.fillStyle = `hsla(${hueBase + cn},50%,50%,${yn})`;
    //             ctx!.fillRect(x, y, dotSize, dotSize);
    //             ctx!.closePath();
    //         }
    //     }
    // }

    // function lerp(x1: number, x2: number, n: number) {
    //     return (1 - n) * x1 + n * x2;
    // }

    // draw();

    // const dataURL = buttonCanvas.toDataURL();
    // buttonSegmentImage.style.backgroundImage = "url(" + dataURL + ")";
    // document.body.appendChild(buttonContainer);
}

function createIntermediaryCanvas() {
    // console.log("createMainCanvas()");
    const canvas = document.createElement('canvas');
    assignCanvasProps(canvas, IntermediaryCanvasProps);
    document.body.appendChild(canvas);
    state.interCtx = canvas.getContext('2d');
    state.interCanvas = canvas;
    state.canvases.push(canvas);
}

function createOffscreenCanvas() {
    // console.log("createOffscreenCanvas()");
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
    // console.log("createHandle()");
    const ringHandle = document.createElement('div');
    ringHandle.id = 'lensor-ring';
    ringHandle.className = 'circle-ring';
    document.body.appendChild(ringHandle);
    state.ringHandle = ringHandle;
    state.canvases.push(ringHandle);
}

function createGridCanvas() {
    // console.log("createGridCanvas()");
    const gridCanvas = document.createElement('canvas');
    assignCanvasProps(gridCanvas, GridCanvasProps);
    document.body.appendChild(gridCanvas);
    state.gridCanvas = gridCanvas;
    state.gridCtx = gridCanvas.getContext('2d');
    state.canvases.push(gridCanvas);
}

function drawGrid(spacing: number) {
    const { gridCtx, gridCanvas } = state;
    if (!gridCtx || !gridCanvas) return;
    if (state.gridOn) {
        // console.log("drawGrid()");
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
    } else {
        gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }

}

function drawCrosshairs() {
    // console.log("drawCrosshairs()");
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
    // console.log("formatDateTime()");
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

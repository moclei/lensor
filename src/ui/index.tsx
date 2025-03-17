import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import Lense from './features/Lense/Lense';
import { connect } from 'crann';
import { LensorStateConfig } from './state-config';
import { ConnectionStatus } from 'crann/dist/types/model/crann.model';
import { observeDOMChanges, observeScrollChange } from '@/scripts/observable';

console.log('Injected Lensor UI mounted');
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
      pointerEvents: 'none'
    },
    invisible: {
      visibility: 'hidden'
    }
  }
};

type BorderCropProps = {
  possibleLetterboxing: boolean;
  possiblePillarboxing: boolean;
  estimatedTopBottomBorderHeight: number;
  estimatedLeftRightBorderWidth: number;
};

type LensorState = {
  mediaStreamId: string | null;
  active: boolean;
  shadowContainer: HTMLDivElement;
  shadowRoot: ShadowRoot | null;
  videoElement: HTMLVideoElement | null;
  offscreenCanvas: HTMLCanvasElement | null;
  scale: number;
  media: void | MediaStream | null;
  imageBitmap: ImageBitmap | null;
  initialized: boolean;
};
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
  initialized: false
};

console.log('[UI] Lensor main container created');
const [useCrann, get, set, subscribe, getAgentInfo, onReady] = connect(
  LensorStateConfig,
  {
    debug: true
  }
);

const [captureCount, setCaptureCount, onCaptureIncrement] =
  useCrann('captureCount');

observeDOMChanges(
  (changeScore: number) => {
    console.log('observeDOMChanges, changeScore: ', changeScore);
  },
  () => {
    setCaptureCount(captureCount + 1);

    // Ensure we have a media stream ID and are in a state to recapture
    const { active, mediaStreamId, initialized } = get();

    console.log('observeDOMChanges, incrementing capture count', {
      active,
      mediaStreamId,
      initialized
    });
    if (active && mediaStreamId) {
      console.log('observeDOMChanges, getting screen image');
      getScreenImage(mediaStreamId);
    }
  }
);

observeScrollChange(
  (scrollPosition: { x: number; y: number }) => {
    console.log('observeScrollChange, scrollPosition: ', scrollPosition);
  },
  () => {
    setCaptureCount(captureCount + 1);

    // Ensure we have a media stream ID and are in a state to recapture
    const { active, mediaStreamId, initialized } = get();

    console.log('observeScrollChange, incrementing capture count', {
      active,
      mediaStreamId,
      initialized
    });
    if (active && mediaStreamId) {
      console.log('observeScrollChange, getting screen image');
      getScreenImage(mediaStreamId);
    }
  }
);

console.log('[UI] Crann connected');
const [active, setActive, onActive] = useCrann('active');
const [initialized, setInitialized, onInitialize] = useCrann('initialized');

const [mediaStreamId, setMediaStreamId, onMediaStreamChange] =
  useCrann('mediaStreamId');
onMediaStreamChange((update) => {
  console.log('handleMediaStreamChange, mediaStreamId: ', update);
  state.mediaStreamId = update.current;
  initializeIfReady();
});
onActive((update) => {
  console.log('handleActiveChange, active: ', update);
  state.active = update.current;
  initializeIfReady();
});
onInitialize((update) => {
  console.log('handleInitializeChange, initialized: ', initialized);
  toggleShadowRootVisibility(true);
});

console.log('[UI] Crann hooks established');

onReady((info: ConnectionStatus) => {
  console.log('[UI] onReady: ', info);
  if (info.connected) {
    console.log('[UI] onReady: connected');
    const agentInfo = getAgentInfo();
    console.log('[UI] onReady: agentInfo: ', agentInfo);
  }
});

async function initializeIfReady() {
  const { active, mediaStreamId } = state;
  const { initialized } = get();
  console.log('[UI] initializeIfReady');
  if (active && mediaStreamId && !initialized) {
    await getScreenImage(mediaStreamId);
  }
}

function initializeShadowRoot() {
  if (self !== top) return;

  console.log('[UI] initializeShadowRoot()');
  const { shadowContainer } = state;
  let { shadowRoot } = state;

  // If shadow root already exists, don't recreate it
  if (shadowRoot) {
    console.log(
      'initializeShadowRoot(), shadowRoot already exists, updating lense'
    );
    updateLenseWithNewImage(state.imageBitmap);
    return;
  }

  document.body.appendChild(shadowContainer);
  setStylesOnElement(shadowContainer, styles.container.shadow);
  shadowRoot = shadowContainer.attachShadow({ mode: 'closed' });
  state.shadowRoot = shadowRoot;

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
        <Lense
          imageBitmap={state.imageBitmap}
          onStop={handleLensorStop}
          onClose={handleLensorClose}
          onRequestNewCapture={handleRequestNewCapture}
        />
      </StyleSheetManager>
    );
  }
  state.initialized = true;
}

// Add a handler for when the Lense component requests a new capture
function handleRequestNewCapture() {
  console.log('Handle request for new capture');
  const { mediaStreamId } = get();
  if (mediaStreamId) {
    getScreenImage(mediaStreamId);
  }
}

const toggleShadowRootVisibility = (visible: boolean) => {
  if (self === top) {
    console.log('toggleShadowRootVisibility()');
    if (state.shadowRoot) {
      let newStyle: Partial<CSSStyleDeclaration> = styles.container.shadow;
      if (!visible) {
        newStyle = { ...newStyle, ...styles.container.invisible };
      }
      setStylesOnElement(state.shadowContainer, newStyle);
    }
  }
};

function updateLenseWithNewImage(imageBitmap: ImageBitmap | null) {
  console.log('Updating Lense with new image');
  state.imageBitmap = imageBitmap;

  // Use a custom event to notify the React component
  if (state.shadowRoot) {
    console.log('updateLenseWithNewImage(), dispatching event');
    const event = new CustomEvent('lensor:image-update', {
      detail: { imageBitmap }
    });
    state.shadowRoot.dispatchEvent(event);
  }
}

// Modify getScreenImage to reuse existing elements
async function getScreenImage(mediaStreamId: string | null) {
  if (!mediaStreamId) return;

  console.log('getScreenImage()');

  // If we're not initialized yet, do the full initialization
  if (!state.initialized) {
    console.log('getScreenImage(), initializing');
    const media = await createMediaStream(mediaStreamId);
    if (!media) return;
    initializeImageCapture(media);
    state.media = media;
    return;
  }
  console.log('getScreenImage(), already initialized, re-capturing');
  // For subsequent captures, just get a new frame
  const media = await createMediaStream(mediaStreamId);
  if (!media) {
    console.log('getScreenImage(), media not created');
    return;
  }
  console.log('getScreenImage(), media created');
  try {
    const imageCapture = new ImageCapture(media.getVideoTracks()[0]);
    const imageBitmap = await imageCapture.grabFrame();

    // Clean up the media stream
    media.getVideoTracks()[0].stop();
    console.log('getScreenImage(), imageBitmap: ', imageBitmap ? 'yes' : 'no');
    // Update the React component with the new image
    updateLenseWithNewImage(imageBitmap);
  } catch (error) {
    console.error('Error capturing new frame:', error);
  }
}

async function cropImageBlackBorder(
  sourceBitmap: ImageBitmap,
  cropMetrics: BorderCropProps
): Promise<ImageBitmap> {
  // Calculate the new dimensions
  const originalWidth = sourceBitmap.width;
  const originalHeight = sourceBitmap.height;
  const newHeight =
    originalHeight - cropMetrics.estimatedTopBottomBorderHeight * 2;
  const newWidth =
    originalWidth - cropMetrics.estimatedLeftRightBorderWidth * 2;

  // Create a new ImageBitmap with the cropped dimensions
  const croppedBitmap = await createImageBitmap(
    sourceBitmap,
    cropMetrics.estimatedLeftRightBorderWidth,
    cropMetrics.estimatedTopBottomBorderHeight,
    newWidth,
    newHeight,
    {
      resizeWidth: newWidth,
      resizeHeight: newHeight,
      resizeQuality: 'high'
    }
  );

  sourceBitmap.close();

  return croppedBitmap;
}

function initializeImageCapture(media: MediaStream) {
  console.log('initializeImageCapture()');
  if (!state.videoElement) {
    console.log('initializeImageCapture(), creating video element');
    const videoElement = state.videoElement || document.createElement('video');
    videoElement.style.visibility = 'hidden';
    videoElement.style.position = 'absolute';
    videoElement.style.left = '-9999px';
    state.videoElement = videoElement;
    document.body.appendChild(state.videoElement);
    state.videoElement.addEventListener('loadedmetadata', (event) => {
      if (!state.videoElement) return;
      console.log('Video element loaded! event: ', event);
      const scaleWidth = state.videoElement.videoWidth / window.innerWidth;
      const scaleHeight = state.videoElement.videoHeight / window.innerHeight;
      state.scale = scaleWidth;
      console.log('Video element width scale: ', scaleWidth);
      console.log('Video element height scale: ', scaleHeight);
    });
    state.videoElement.oncanplay = onImageCaptureBegin;
  }
  state.videoElement.srcObject = media;
  state.videoElement.play();
}

function calculateImageBlackBorder(imageBitmap: ImageBitmap): BorderCropProps {
  // Window dimensions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const windowAspectRatio = windowWidth / windowHeight;

  // Captured image dimensions
  const captureWidth = imageBitmap.width;
  const captureHeight = imageBitmap.height;
  const captureAspectRatio = imageBitmap.width / imageBitmap.height;
  const widthScaleFactor = captureWidth / windowWidth;
  const heightScaleFactor = captureHeight / windowHeight;

  // Determine if the image is letterboxing or pillarboxing
  let possibleLetterboxing = false;
  let possiblePillarboxing = false;
  let estimatedTopBottomBorderHeight = 0;
  let estimatedLeftRightBorderWidth = 0;

  if (widthScaleFactor < heightScaleFactor) {
    possibleLetterboxing = true;
    possiblePillarboxing = false;

    // What height would the capture be if it maintained window aspect ratio?
    const expectedHeight = captureWidth / windowAspectRatio;
    const totalBorderHeight = captureHeight - expectedHeight;
    estimatedTopBottomBorderHeight = totalBorderHeight / 2;
    estimatedLeftRightBorderWidth = 0;
  } else {
    // Width is scaled less than height, suggesting pillarboxing (black bars on left/right)
    possibleLetterboxing = false;
    possiblePillarboxing = true;

    const expectedWidth = captureHeight * windowAspectRatio;
    const totalBorderWidth = captureWidth - expectedWidth;
    estimatedLeftRightBorderWidth = totalBorderWidth / 2;
    estimatedTopBottomBorderHeight = 0;
  }
  return {
    possibleLetterboxing,
    possiblePillarboxing,
    estimatedTopBottomBorderHeight,
    estimatedLeftRightBorderWidth
  };
}

async function createMediaStream(
  streamId: string
): Promise<MediaStream | null> {
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
    console.error('error starting recording: ', recordException);
    // console.log('error starting recording: ', recordException);
    media = null;
  }
  return media;
}

// Modify onImageCaptureBegin to use the new update function
async function onImageCaptureBegin() {
  console.log('onImageCaptureBegin');
  const { videoElement, media } = state;

  if (!videoElement || !media) return;

  const imageCapture = new ImageCapture(media.getVideoTracks()[0]);
  console.log(
    'Video track settings: ',
    media.getVideoTracks()[0].getSettings()
  );
  const imageBitmap = await imageCapture.grabFrame();

  console.log('onImageCapture, imageBitmap: ', imageBitmap);
  media.getVideoTracks()[0].stop();

  const cropMetrics = calculateImageBlackBorder(imageBitmap);
  const croppedBitmap = await cropImageBlackBorder(imageBitmap, cropMetrics);
  // Update state and initialize shadow root if needed
  state.imageBitmap = croppedBitmap;
  initializeShadowRoot();
}

function cropImage(
  canvasWidth: number,
  canvasHeight: number,
  windowWidth: number,
  windowHeight: number
): { x: number; y: number; width: number; height: number } {
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

function setStylesOnElement(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, styles);
}

function injectFontFace() {
  // nothing to do here yet
}

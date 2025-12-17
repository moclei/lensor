import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import Lense from './features/Lense/Lense';
import CaptureFlash from './features/CaptureFlash/CaptureFlash';
import { connect } from 'crann';
import { LensorStateConfig } from './state-config';
import { debug } from '../lib/debug';

const log = debug.ui;

log('Lensor UI script loaded');

const LENSOR_CONTAINER_ID = 'lensor-shadow-container';

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

type LensorState = {
  active: boolean;
  shadowContainer: HTMLDivElement;
  shadowRoot: ShadowRoot | null;
  videoElement: HTMLVideoElement | null;
  scale: number;
  media: void | MediaStream | null;
  imageBitmap: ImageBitmap | null;
};

// Check if we already have a container in the DOM (from a previous injection)
function getOrCreateContainer(): HTMLDivElement {
  const existing = document.getElementById(
    LENSOR_CONTAINER_ID
  ) as HTMLDivElement | null;
  if (existing) {
    log('Found existing container, removing for fresh start');
    existing.remove();
  }
  const container = document.createElement('div');
  container.id = LENSOR_CONTAINER_ID;
  return container;
}

const state: LensorState = {
  active: false,
  shadowContainer: getOrCreateContainer(),
  shadowRoot: null,
  videoElement: null,
  scale: 1,
  media: null,
  imageBitmap: null
};

const crann = connect(LensorStateConfig, {
  debug: false
});
const { useCrann, onReady } = crann;
const [_active, setActive, onActive] = useCrann('active');
const [initialized, setInitialized] = useCrann('initialized');
const [_isSidepanelShown, setIsSidepanelShown] = useCrann('isSidepanelShown');

/**
 * Gracefully shut down the extension.
 * This stops the screen capture (removing the recording indicator),
 * hides the UI, and closes the sidepanel.
 *
 * The extension can be restarted by clicking the extension icon again.
 */
function shutdownLensor() {
  log('Shutting down Lensor due to inactivity');

  // Set active to false - this triggers MediaStream cleanup in useMediaCapture
  setActive(false);

  // Close the sidepanel
  setIsSidepanelShown(false);

  // The visibility toggle will happen automatically via onActive subscription
}

// Export for use by Lense component
(window as any).__lensorShutdown = shutdownLensor;

onReady(() => {
  log('Crann ready');
  if (!initialized) {
    initializeReact();
    setInitialized(true);
  }
});

onActive((update) => {
  log('Active state changed: %o', update);
  if (self === top && state.shadowRoot && update.current !== update.previous) {
    toggleShadowRootVisibility(update.current);
  }
});

const toggleShadowRootVisibility = (visible: boolean) => {
  if (self !== top || !state.shadowContainer) return;
  log('Setting visibility: %s', visible);
  let newStyle: Partial<CSSStyleDeclaration> = styles.container.shadow;
  if (!visible) {
    newStyle = { ...newStyle, ...styles.container.invisible };
  }
  setStylesOnElement(state.shadowContainer, newStyle);
};

function initializeReact() {
  log('Initializing React');
  const { shadowContainer } = state;
  let { shadowRoot } = state;

  // If shadow root already exists, don't recreate it
  if (shadowRoot) {
    log('Shadow root already exists, skipping');
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

  log('Creating React root');
  if (styleSlot) {
    const root = createRoot(uiRoot);
    root.render(
      <StyleSheetManager target={styleSlot}>
        <>
          <CaptureFlash />
          <Lense onStop={handleLensorStop} onClose={handleLensorClose} />
        </>
      </StyleSheetManager>
    );
  }
}

function handleLensorStop() {
  log('Stop requested');
}

function handleLensorClose() {
  log('Close requested');
}

function setStylesOnElement(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, styles);
}

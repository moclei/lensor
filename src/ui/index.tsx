import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import Lense from './features/Lense/Lense';
import CaptureFlash from './features/CaptureFlash/CaptureFlash';
import { debug } from '../lib/debug';
import {
  CrannProvider,
  useAgent,
  useCrannReady,
  useCrannState
} from './hooks/useLensorState';

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

function setStylesOnElement(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, styles);
}

/**
 * LensorApp - Main app component that handles initialization and visibility
 */
function LensorApp({
  shadowContainer,
  onStop,
  onClose
}: {
  shadowContainer: HTMLDivElement;
  onStop: () => void;
  onClose: () => void;
}) {
  const isReady = useCrannReady();
  const [active] = useCrannState('active');
  const [initialized, setInitialized] = useCrannState('initialized');

  // DEBUG: Log current hook values
  console.log('[UI] Hook values:', { isReady, active, initialized });

  // Use ref to track if we've already initialized (prevents re-running effect)
  const hasInitializedRef = React.useRef(false);

  // Handle initialization when agent is ready - only run once
  React.useEffect(() => {
    console.log(
      '[UI] Init effect running, isReady:',
      isReady,
      'hasInitializedRef:',
      hasInitializedRef.current
    );
    if (isReady && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      console.log('[UI] About to call setInitialized(true)');
      setInitialized(true);
      console.log('[UI] Called setInitialized(true)');
    }
  }, [isReady]); // Only depend on isReady, not initialized or setInitialized

  // Handle visibility based on active state
  React.useEffect(() => {
    console.log('[UI] Visibility effect, active:', active);
    if (self !== top || !shadowContainer) return;
    log('Setting visibility: %s', active);
    let newStyle: Partial<CSSStyleDeclaration> = styles.container.shadow;
    if (!active) {
      newStyle = { ...newStyle, ...styles.container.invisible };
    }
    setStylesOnElement(shadowContainer, newStyle);
  }, [active, shadowContainer]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <CaptureFlash />
      <Lense onStop={onStop} onClose={onClose} />
    </>
  );
}

function initializeReact() {
  log('Initializing React');
  const shadowContainer = getOrCreateContainer();

  document.body.appendChild(shadowContainer);
  setStylesOnElement(shadowContainer, styles.container.shadow);
  const shadowRoot = shadowContainer.attachShadow({ mode: 'closed' });

  const styleSlot = document.createElement('div');
  const fontStyle = document.createElement('style');

  shadowRoot.appendChild(styleSlot);
  shadowRoot.appendChild(fontStyle);

  const uiRoot = document.createElement('div');
  uiRoot.style.height = '100%';

  shadowRoot.appendChild(uiRoot);

  log('Creating React root');
  const root = createRoot(uiRoot);
  root.render(
    <StyleSheetManager target={styleSlot}>
      <LensorApp
        shadowContainer={shadowContainer}
        onStop={handleLensorStop}
        onClose={handleLensorClose}
      />
    </StyleSheetManager>
  );
}

function handleLensorStop() {
  log('Stop requested');
}

function handleLensorClose() {
  log('Close requested');
}

// Initialize immediately
initializeReact();

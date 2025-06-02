import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import Lense from './features/Lense/Lense';
import { connect } from 'crann';
import { LensorStateConfig } from './state-config';

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

type LensorState = {
  active: boolean;
  shadowContainer: HTMLDivElement;
  shadowRoot: ShadowRoot | null;
  videoElement: HTMLVideoElement | null;
  scale: number;
  media: void | MediaStream | null;
  imageBitmap: ImageBitmap | null;
};

const state: LensorState = {
  active: false,
  shadowContainer: document.createElement('div'),
  shadowRoot: null,
  videoElement: null,
  scale: 1,
  media: null,
  imageBitmap: null
};

const crann = connect(LensorStateConfig, {
  debug: true
});
const { useCrann, onReady } = crann;
const [_active, _setActive, onActive] = useCrann('active');
const [initialized, setInitialized] = useCrann('initialized');

onReady(() => {
  console.log('[UI] onReady()');
  if (!initialized) {
    initializeReact();
    setInitialized(true);
  }
});

onActive((update) => {
  console.log('onActive, active: ', { update });
  if (self === top && state.shadowRoot && update.current !== update.previous) {
    console.log('onActive, toggling shadow root visibility: ', { update });
    // if (!initialized) {
    //   initializeReact();
    // }
    toggleShadowRootVisibility(update.current);
  }
});

const toggleShadowRootVisibility = (visible: boolean) => {
  if (self !== top || !state.shadowContainer) return;
  console.log('toggleShadowRootVisibility()');
  let newStyle: Partial<CSSStyleDeclaration> = styles.container.shadow;
  if (!visible) {
    newStyle = { ...newStyle, ...styles.container.invisible };
  }
  setStylesOnElement(state.shadowContainer, newStyle);
};

function initializeReact() {
  console.log('[UI] initializeReact()');
  const { shadowContainer } = state;
  let { shadowRoot } = state;

  // If shadow root already exists, don't recreate it
  if (shadowRoot) {
    console.log('[UI] initializeReact() shadowRoot already exists');
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
  // injectFontFace();

  console.log('[UI] initializeReact() creating root');
  if (styleSlot) {
    const root = createRoot(uiRoot);
    root.render(
      <StyleSheetManager target={styleSlot}>
        <Lense onStop={handleLensorStop} onClose={handleLensorClose} />
      </StyleSheetManager>
    );
  }
}

function handleLensorStop() {
  console.log('Handle lensor stop');
}

function handleLensorClose() {
  console.log('Handle lensor close');
}

function setStylesOnElement(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, styles);
}

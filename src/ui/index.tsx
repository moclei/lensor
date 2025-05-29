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
  scale: number;
  media: void | MediaStream | null;
  imageBitmap: ImageBitmap | null;
};

const state: LensorState = {
  mediaStreamId: null,
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
const { useCrann, get, set, subscribe, getAgentInfo, onReady } = crann;
const [_active, _setActive, onActive] = useCrann('active');
const [initialized, setInitialized, onInitialize] = useCrann('initialized');
const [_mediaStreamId, _setMediaStreamId, onMediaStreamChange] =
  useCrann('mediaStreamId');

onMediaStreamChange((update) => {
  console.log('handleMediaStreamChange, mediaStreamId: ', update);
  if (update.current && update.current !== update.previous) {
    state.mediaStreamId = update.current;
    initializeReact();
  }
});

onActive((update) => {
  console.log('handleInitializeChange, initialized: ', initialized);
  if (self === top && state.shadowRoot && update.current !== update.previous) {
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
        <Lense
          mediaStreamId={state.mediaStreamId}
          onStop={handleLensorStop}
          onClose={handleLensorClose}
        />
      </StyleSheetManager>
    );
  }
  setInitialized(true);
}

function handleLensorStop() {
  console.log('Handle lensor stop');
}

function handleLensorClose() {
  console.log('Handle lensor close');
}

// function handlePopoverVisibility(show: boolean) {
//   console.log('Handle popover visibility');
//   if (state.shadowRoot) {
//     let newStyles: Partial<CSSStyleDeclaration> = styles.container.shadow;
//     if (!show) {
//       newStyles = { ...newStyles, ...styles.container.invisible };
//     }
//     setStylesOnElement(state.shadowContainer, newStyles);
//     return;
//   }
// }

function setStylesOnElement(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) {
  Object.assign(element.style, styles);
}

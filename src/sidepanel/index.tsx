import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import App from './App';
import { debug } from '../lib/debug';

const log = debug.ui;

const styles = {
  container: {
    shadow: {
      width: '100%',
      height: '100vh'
    },
    invisible: {
      visibility: 'hidden'
    }
  }
};

log('Sidepanel script loaded');

document.addEventListener('DOMContentLoaded', function () {
  initializeReactApp();
});

function initializeReactApp() {
  if (self === top) {
    log('Initializing sidepanel React app');
    const appContainer = document.createElement('div');
    document.body.appendChild(appContainer);
    setStylesOnElement(appContainer, styles.container.shadow);

    const styleSlot = document.createElement('div');
    const fontStyle = document.createElement('style');

    appContainer.appendChild(styleSlot);
    appContainer.appendChild(fontStyle);

    const uiRoot = document.createElement('div');
    uiRoot.style.height = '100%';

    appContainer.appendChild(uiRoot);
    injectFontFace();

    if (styleSlot) {
      const root = createRoot(uiRoot);
      root.render(
        <StyleSheetManager target={styleSlot}>
          <App />
        </StyleSheetManager>
      );
    }
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

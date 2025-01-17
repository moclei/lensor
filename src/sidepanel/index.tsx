import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import React from 'react';
import './index.css';
import { connect, connected } from 'crann';
import { connect as porterConnect } from "porter-source";
import { LensorStateConfig } from "../weirwood/state-config";
import App from './App';

const styles = {
    container: {
        shadow: {
            width: '100%',
            height: '100vh',
        },
        invisible: {
            visibility: 'hidden',
        }
    }
}

type SidepanelState = {
}
const state: SidepanelState = {
}


console.log('Sidepanel: Lensor sidepanel container created');
const [post, setMessage] = porterConnect();

const [useCrann, get] = connect(LensorStateConfig);
const [active, setActive, onActive] = useCrann('active');
const [initialized, setInitialized, onInitialize] = useCrann('initialized');

onActive((active: boolean) => {
    console.log('Sidepanel: handleActiveChange, active: ', active);
});
onInitialize(() => {
    console.log('Sidepanel: handleInitializeChange, initialized: ', initialized);
});

document.addEventListener('DOMContentLoaded', function () {
    const relayElement = document.getElementById('relay-button')! as HTMLInputElement;

    console.log('Sidepanel: sidepanel, document: ', document);
    console.log('Sidepanel: sidepanel, relayElement: ', relayElement);
    initializeReactApp();
});

function initializeReactApp() {
    if (self === top) {
        console.log('Sidepanel: initializeShadowRoot()')
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
        setInitialized(true);
    }
}

function setStylesOnElement(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
    Object.assign(element.style, styles);
}

function injectFontFace() {
    // nothing to do here yet
}
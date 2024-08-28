import tabsMan from './tabs/tabs-manager';
import { create, Partition } from 'crann';
import { source, getMetadata, AgentMetadata, PorterContext } from 'porter-source';

console.log("lensor service worker created! version: ", chrome.runtime.getManifest().version);
tabsMan.initialize();

// Set up state with crann
const [get, set, subscribe, findAgent] = create({
    active: {
        default: false,
        partition: Partition.Instance
    },
    initialized: {
        default: false,
        partition: Partition.Instance
    },
    mediaStreamId: {
        default: null as string | null,
        partition: Partition.Instance
    },
});

subscribe(async (state, changes, agentMeta) => {
    if (!agentMeta) return;
    const { active, initialized, mediaStreamId } = state;
    const { location } = getMetadata(agentMeta.key)!;
    console.log('active: ', active, ', initialized: ', initialized, ', mediaStreamId: ', mediaStreamId);
    if (active && !mediaStreamId) {
        console.log('Active but null media stream, create one.');
        // Get a MediaStream for the active tab.
        const streamId = await (chrome.tabCapture as any).getMediaStreamId({
            consumerTabId: location.index,
            targetTabId: location.index
        });
        set({ mediaStreamId: streamId }, agentMeta.key);
    }
});

// const [active, setActive] = crann.subscribe('active');
async function handleActionButtonClick(tab: chrome.tabs.Tab) {
    console.log('Action clicked, tab: ', tab);
    if (!tab.id) return;

    post({ action: 'action-clicked', payload: null }, tab.id);
    const key = findAgent(PorterContext.ContentScript, { index: tab.id });
    if (!key) {
        console.warn('action button clicked but no agent found for that tab.');
        return;
    }
    const { active, initialized } = get(key);
    set({ active: !active }, key);
    if (!initialized) {
        console.log('Not initialized, starting app.');
        chrome.tabs.sendMessage(tab.id, {
            type: 'start-app',
            tabId: tab.id
        });
    } else {
        console.log('Initialized, stopping app.');
        chrome.tabs.sendMessage(tab.id, {
            type: 'stop-app',
            tabId: tab.id
        });
    }
}

// Set up messaging with porter
const [post, setMessages, onConnect] = source();
onConnect(handlePorterConnect);
setMessages({
    hello_back: (message, agent) => {
        console.log('Received hello_back message: ', message, agent);
    }
});
// porter.onConnect.addListener(handlePorterConnect);
chrome.runtime.onMessage.addListener(async (message) => {
    console.log('Message heard in service worker: ', message);
})
chrome.runtime.onStartup.addListener(() => {
    console.log("Chrome started, initializing extension.");
});
chrome.runtime.onSuspend.addListener(() => {
    console.log("Unloading extension, saving state.");
});
chrome.runtime.onSuspendCanceled.addListener(() => {
    console.log("Extension unload canceled, continuing operations.");
});
chrome.runtime.onUpdateAvailable.addListener(updateInfo => {
    console.log(`Update available: ${updateInfo.version}`);
});

chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
    console.log('onInstalled, details: ', details);
    if (details.reason === "install") {
        console.log("Extension installed for the first time");
    } else if (details.reason === "update") {
        console.log(`Extension updated to version ${details.previousVersion}`);
    }
    const currentTabs = await tabsMan.getTabs();
    console.log('onInstalled, currentTabs: ', currentTabs);
    for (const tab of currentTabs) {
        console.log('onInstalled, reloading tab: ', tab);
        chrome.tabs.reload(tab[0]).then(() => {
            if (chrome.runtime.lastError) {
                console.log("Error reloading tab(", tab[0], "), lastError: ", chrome.runtime.lastError);
            } else {
                console.log("Reloaded tab ", tab[0]);
            }
        });
    }

    //Setup sidepanel context menu
    setupContextMenu();
});

function setupContextMenu() {
    console.log('setting up context menus')
    chrome.contextMenus.create({
        id: 'define-word-lensor',
        title: 'Define A Word',
        type: 'normal',
        contexts: ['page']
    });
}


chrome.contextMenus.onClicked.addListener((data, tab) => {
    // Store the last word in chrome.storage.session.
    chrome.storage.session.set({ lastWord: data.selectionText });

    // Make sure the side panel is open.
    chrome.sidePanel.open({ tabId: tab!.id! });
});

chrome.action.onClicked.addListener(handleActionButtonClick);

function handlePorterConnect({ key, connectionType, context, location }: AgentMetadata) {
    console.log('Porter connected, connectContext: ', context, ', connectionType: ', connectionType, ', key: ', key, ', location: ', location);
    // if (context === PorterContext.ContentScript) {
    //     porter.post({ action: 'hello', payload: null }, PorterContext.ContentScript, location);
    // }
    post({ action: `hello`, payload: { answer: `Hello ${context}!` } }, key);
}
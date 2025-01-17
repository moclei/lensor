import tabsMan from './tabs/tabs-manager';
import { create, Partition } from 'crann';
import { source, getMetadata, AgentMetadata, PorterContext } from 'porter-source';
import { LensorStateConfig } from '../weirwood/state-config';

console.log("lensor service worker created! version: ", chrome.runtime.getManifest().version);
tabsMan.initialize();

// Set up state with crann
const [get, set, subscribe, findAgent] = create(LensorStateConfig);

subscribe((state, changes, agentMeta) => {
    if (changes.hasOwnProperty('isSidepanelShown')) {
        console.log('changes has own property isSidepanelShown');
        if (changes.isSidepanelShown === true) {
            console.log('Opening a sidepanel!');
            chrome.sidePanel.setOptions({
                tabId: agentMeta?.location.index!,
                path: 'sidepanel/sidepanel.html',
                enabled: true
            });
            chrome.sidePanel.open({ tabId: agentMeta?.location.index! });
        }
        else {
            chrome.sidePanel.setOptions({
                tabId: agentMeta?.location.index!,
                enabled: false
            });
        }

    }
    if (!agentMeta) return;
    const { active, initialized, mediaStreamId } = state;
    const { location } = getMetadata(agentMeta.key)!;
    console.log('active: ', active, ', initialized: ', initialized, ', mediaStreamId: ', mediaStreamId);
    if (active && !mediaStreamId) {
        console.log('Active but null media stream, create one.');
        // Get a MediaStream for the active tab.
        (chrome.tabCapture as any).getMediaStreamId({
            consumerTabId: location.index,
            targetTabId: location.index
        }).then((streamId: string) => {
            set({ mediaStreamId: streamId }, agentMeta.key);
        });
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    //console.log("Tab updated ", tabId, changeInfo, tab);
    if (changeInfo.status == 'complete' && tab.status == 'complete' && tab.url != undefined) {
        const key = findAgent(PorterContext.ContentScript, { index: tabId });
        console.log("Did we find a key: ", key);
        if (key && get(key).isSidepanelShown) {
            console.log('tabs onUpdated isSidepanelShown');
            await chrome.sidePanel.setOptions({
                tabId,
                path: 'sidepanel/sidepanel.html',
                enabled: true
            });
        } else {
            console.log('tabs onUpdated isSidepanelShown = false');
            // Disables the side panel on all other sites
            await chrome.sidePanel.setOptions({
                tabId,
                enabled: false
            });
        }
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab activated: ', activeInfo);
    const key = findAgent(PorterContext.ContentScript, { index: activeInfo.tabId });
    console.log('Did we find a key: ', key);
    if (key && get(key).isSidepanelShown) {
        console.log('tabs onActivated isSidepanelShown');
        chrome.sidePanel.setOptions({
            tabId: activeInfo.tabId,
            path: 'sidepanel/sidepanel.html',
            enabled: true
        });
    } else {
        console.log('tabs onActivated isSidepanelShown = false');
        // Disables the side panel on all other sites
        chrome.sidePanel.setOptions({
            tabId: activeInfo.tabId,
            enabled: false
        });
    }
});

// const [active, setActive] = crann.subscribe('active');
async function handleActionButtonClick(tab: chrome.tabs.Tab) {
    console.log('Action clicked, tab: ', tab);
    if (!tab.id) return;

    const key = findAgent(PorterContext.ContentScript, { index: tab.id });
    if (!key) {
        console.warn('action button clicked but no agent found for that tab.');
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['ui/index.js']
        }).then(() => {
            console.log('Injected ui script into tab: ', tab.id);
            const key = findAgent(PorterContext.ContentScript, { index: tab.id! });
            console.warn('Injected ui, did we find a key? ', key);
            if (key) {
                set({ active: true }, key);
            }
        });
        return;
    } else {
        const { active, initialized } = get(key);
        set({ active: !active }, key);
    }
}

// Set up messaging with porter
const [post, setMessages, onConnect] = source();
onConnect(handlePorterConnect);
setMessages({
    hello_back: (message, agent) => {
        console.log('Received hello_back message: ', message, agent);
    },
    settings_clicked: (message, agent) => {
        console.log('Received settings_clicked message: ', message, agent);
        chrome.sidePanel.open({ tabId: agent?.location.index! });
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

});


chrome.action.onClicked.addListener(handleActionButtonClick);

function handlePorterConnect({ key, connectionType, context, location }: AgentMetadata) {
    console.log('Porter connected, connectContext: ', context, ', connectionType: ', connectionType, ', key: ', key, ', location: ', location);
    // if (context === PorterContext.ContentScript) {
    //     porter.post({ action: 'hello', payload: null }, PorterContext.ContentScript, location);
    // }
    post({ action: `hello`, payload: { answer: `Hello ${context}!` } }, key);
}
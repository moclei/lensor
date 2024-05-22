import tabsMan from './tabs/tabs-manager';
import { create, Partition } from 'weirwood';

console.log("lensor service worker created! version: ", chrome.runtime.getManifest().version);
tabsMan.initialize();

const weirwood = create({
    active: {
        default: false,
        partition: Partition.Instance
    },
})

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

chrome.action.onClicked.addListener(async (tab) => {
    // let storage = await chrome.storage.local.get('recording');
    const { active } = weirwood.get(tab.id!);
    weirwood.set({ active: !active }, tab.id!);
    let tabMap = await tabsMan.getTabs();
    let recording = false;
    if (tab.id && tabMap.has(tab.id)) {
        console.log("had tabId, getting recording status");
        recording = tabMap.get(tab.id) || false;

        console.log("recording status was " + recording);
    } else {
        console.log("no tabId, setting recording status to false");
    }

    if (recording) {
        chrome.tabs.sendMessage(tab.id!, {
            type: 'stop-recording',
        });
        return;
    }
    // Get a MediaStream for the active tab.
    const streamId = await (chrome.tabCapture as any).getMediaStreamId({
        consumerTabId: tab.id,
        targetTabId: tab.id
    });
    // Send the stream ID to the offscreen document to start recording.
    chrome.tabs.sendMessage(tab.id!, {
        type: 'start-recording',
        data: streamId,
        tabId: tab.id
    });
});
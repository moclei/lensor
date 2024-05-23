import { LensorStateConfig } from '../weirwood/state-config';
import tabsMan from './tabs/tabs-manager';
import { create, Partition } from 'weirwood';

console.log("lensor service worker created! version: ", chrome.runtime.getManifest().version);
tabsMan.initialize();

const weirwood = create(LensorStateConfig)

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
    console.log('Action clicked, tab: ', tab);
    const { active, initialized } = weirwood.get(tab.id!);
    if (!initialized) {
        console.log('Not initialized, starting app.');
        // Get a MediaStream for the active tab.
        const streamId = await (chrome.tabCapture as any).getMediaStreamId({
            consumerTabId: tab.id,
            targetTabId: tab.id
        });
        // Send the stream ID to the offscreen document to start recording.
        chrome.tabs.sendMessage(tab.id!, {
            type: 'start-app',
            data: streamId,
            tabId: tab.id
        });
    }

});
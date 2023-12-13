import tabWatch, { getTabs } from './tabs/tabs-manager';

console.log("lensor service worker created! version: ", chrome.runtime.getManifest().version);
tabWatch();

chrome.runtime.onMessage.addListener(async (message) => {
    console.log('Message heard in service worker: ', message);
})
chrome.runtime.onStartup.addListener(() => {
    console.log("Chrome started, initializing extension.");
});
chrome.runtime.onSuspend.addListener(() => {
    console.log("Unloading extension, saving state.");
    // Perform cleanup or save tasks
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
    const currentTabs = await getTabs();
    console.log('onInstalled, currentTabs: ', currentTabs);
    for (const tab of currentTabs) {
        console.log('onInstalled, reloading tab: ', tab);
        chrome.tabs.reload(tab).then(() => {
            if (chrome.runtime.lastError) {
                console.log("Error reloading tab(", tab, "), lastError: ", chrome.runtime.lastError);
            } else {
                console.log("Reloaded tab ", tab);
            }
        });
    }
});

chrome.action.onClicked.addListener(async (tab) => {
    const existingContexts = await chrome.runtime.getContexts({});
    console.log('existing contexts: ', existingContexts);
    let storage = await chrome.storage.local.get('recording');
    const recording = storage.recording || false;
    console.log('recording?: ', recording);
    if (recording) {
        console.log('sending stop-recording message');
        chrome.tabs.sendMessage(tab.id!, {
            type: 'stop-recording',
        });
        return;
    }

    console.log('Getting streamId');
    // Get a MediaStream for the active tab.
    const streamId = await (chrome.tabCapture as any).getMediaStreamId({
        consumerTabId: tab.id,
        targetTabId: tab.id
    });
    console.log('streamId: ', streamId);
    // Send the stream ID to the offscreen document to start recording.
    chrome.tabs.sendMessage(tab.id!, {
        type: 'start-recording',
        data: streamId
    });
    console.log('sent start-recording');
});
let hostSites: string[] = [];

function doesUrlMatchPatterns(url: string, patterns: string[]) {
    // Convert a host permission pattern to a regular expression
    function patternToRegExp(pattern: string) {
        // Escape special characters and replace * with .*
        const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        // Match the entire string
        return new RegExp('^' + escapedPattern + '$');
    }
    // Check each pattern to see if it matches the URL
    return patterns.some(pattern => {
        const regExp = patternToRegExp(pattern);
        return regExp.test(url);
    });
}

const getHosts = async () => {
    const permissions = await chrome.permissions.getAll();
    hostSites = permissions.origins || [];
}

const registerTab = async (tabId: number) => {
    const currentTabs = await getTabs();
    if (!currentTabs.has(tabId)) {
        currentTabs.set(tabId, false);
        await chrome.storage.session.set({ 'tabs': Array.from(currentTabs) });
    }
}

const clearTabs = async () => {
    await chrome.storage.session.clear();
}

const deRegisterTab = async (tabId: number) => {
    const currentTabs = await getTabs();
    if (currentTabs.has(tabId)) {
        currentTabs.delete(tabId);
        await chrome.storage.session.set({ 'tabs': Array.from(currentTabs) });
    }
}

const getTabs = async (): Promise<Map<number, boolean>> => {
    let storage = null;
    try {
        storage = await chrome.storage.session.get('tabs');
    } catch (storageError) {
        console.log("Error getting tabs from session storage: ", storageError);
        return new Map([]);
    }
    if (chrome.runtime.lastError) {
        console.log("Error getting tabs from session storage (lastError): ", chrome.runtime.lastError);
        return new Map([]);
    }
    // console.log("getTabs, storage: ", storage);
    return new Map(storage?.tabs || []);
}


const setTabRecording = async (tabId: number, status: boolean) => {
    const currentTabs = await getTabs();
    currentTabs.set(tabId, status);
    await chrome.storage.session.set({ 'tabs': Array.from(currentTabs) });
}


// Set up listeners for tab events
const initialize = () => {
    getHosts();
    chrome.tabs.onRemoved.addListener(async (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
        // console.log('onRemoved, tabId: ', tabId, '. removeInfo: ', removeInfo);
        deRegisterTab(tabId);
    });
    chrome.tabs.onUpdated.addListener(async (tabId: number, removeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
        // console.log('onUpdated, tabId: ', tabId, '. removeInfo: ', removeInfo);
        if (!tab.url || !tab.id) return;
        const isMatch = doesUrlMatchPatterns(tab.url, hostSites);
        if (isMatch) {
            registerTab(tab.id);
        } else {
            deRegisterTab(tab.id)
        }
    });
    chrome.tabs.onCreated.addListener(async (tab: chrome.tabs.Tab) => {
        // console.log('onCreated, tab: ', tab);
        if (!tab.url || !tab.id) return;
        const isMatch = doesUrlMatchPatterns(tab.url, hostSites);
        if (isMatch) {
            registerTab(tab.id);
        }
    });
    chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
        console.log("Tab attached: ", tabId, attachInfo.newWindowId);
    });
    chrome.tabs.onActivated.addListener(info => {
        // console.log("Active tab changed: ", info.tabId, info.windowId);
    });
    chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
        console.log("Tab detached: ", tabId, detachInfo.oldWindowId);
    });
    chrome.tabs.onHighlighted.addListener(highlightInfo => {
        // console.log("Tabs highlighted: ", highlightInfo.tabIds);
    });
    chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
        console.log("Tab moved: ", tabId, moveInfo.fromIndex, moveInfo.toIndex);
    });
    chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
        console.log("Tab replaced: ", addedTabId, removedTabId);
    });
}

export default { initialize, getTabs, clearTabs, setTabRecording };
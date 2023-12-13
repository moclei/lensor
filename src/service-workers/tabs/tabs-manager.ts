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
        currentTabs.add(tabId);
        await chrome.storage.local.set({'tabs': Array.from(currentTabs)});
        console.log("TabAdded, tabs: ", currentTabs);
    }
}

const deRegisterTab = async (tabId: number) => {
    const currentTabs = await getTabs();
    if (currentTabs.has(tabId)) {
        currentTabs.delete(tabId);
        await chrome.storage.local.set({'tabs': Array.from(currentTabs)});
        console.log("TabRemoved, tabs: ", currentTabs);
    }
}

const getTabs = async (): Promise<Set<number>> => {
    let storage = null;
    try {
        storage = await chrome.storage.local.get('tabs');
    } catch (storageError) {
        console.log("Error getting tabs from session storage: ", storageError);
        return new Set([]);
    }
    if (chrome.runtime.lastError) {
        console.log("Error getting tabs from session storage (lastError): ", chrome.runtime.lastError);
        return new Set([]);
    }
    console.log("getTabs, storage: ", storage);
    return new Set(storage?.tabs || []);
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
}

export default initialize;
export {getTabs};
import { create, DerivedState } from 'crann';

import { LensorStateConfig } from '../ui/state-config';
import { PorterContext } from 'porter-source';
import { debug } from '../lib/debug';

const log = debug.sw;

log(
  'Service worker created, version: %s',
  chrome.runtime.getManifest().version
);

// Set up state with crann
const { get, set, subscribe, queryAgents, onInstanceReady } = create(
  LensorStateConfig,
  {
    debug: false
  }
);

async function handleActionButtonClick(tab: chrome.tabs.Tab) {
  log('Action button clicked on tab: %o', tab);
  if (!tab.id) return;

  const { key, state } = getAgentStateByTabId(tab.id);

  if (key && state) {
    log('Found existing agent for tab: %o', { key, state });
    const { active: isActive } = get(key);
    log('Toggling active state to: %s', !isActive);
    set({ active: !isActive }, key);
  }
  if (!key || !state) {
    console.warn('[SW] Action button clicked but no agent found for tab', {
      key,
      state
    });
    await injectContentScript(tab.id);
  }
}

subscribe((state, changes, agentInfo) => {
  if (!agentInfo || !agentInfo.location.tabId) {
    console.warn('[SW] Subscribe: Agent non-existent or no tabId');
    return;
  }
  if ('isSidepanelShown' in changes) {
    log('isSidepanelShown changed: %s', changes.isSidepanelShown);
    if (changes.isSidepanelShown === true) {
      log('Opening sidepanel');
      chrome.sidePanel.setOptions({
        tabId: agentInfo.location.tabId,
        path: 'sidepanel/sidepanel.html',
        enabled: true
      });
      chrome.sidePanel.open({ tabId: agentInfo.location.tabId });
    } else {
      chrome.sidePanel.setOptions({
        tabId: agentInfo.location.tabId,
        enabled: false
      });
    }
  }
  if ('initialized' in changes) {
    log('Initialized changed: %s', changes.initialized);
    if (changes.initialized === true) {
      log('Activating UI');
      const { key, state } = getAgentStateByTabId(agentInfo.location.tabId);
      if (!key) {
        console.warn('[SW] No key found for tabId', agentInfo.location.tabId);
        return;
      }
      const { active: isActive } = get(key);
      log('Toggling active state to: %s', !isActive);
      set({ active: !isActive }, key);
    }
  }
});

async function injectContentScript(tabId: number) {
  log('Injecting content script into tab: %d', tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['ui/index.js']
  });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (
    changeInfo.status == 'complete' &&
    tab.status == 'complete' &&
    tab.url != undefined
  ) {
    const { key, state } = getAgentStateByTabId(tabId);
    log('Tab updated, agent state: %o', { key, hasState: !!state });
    if (state?.isSidepanelShown) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidepanel/sidepanel.html',
        enabled: true
      });
    } else {
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  log('Tab activated: %o', activeInfo);

  const { key, state } = getAgentStateByTabId(activeInfo.tabId);
  log('Agent state for activated tab: %o', { key, hasState: !!state });

  if (state?.isSidepanelShown) {
    chrome.sidePanel.setOptions({
      tabId: activeInfo.tabId,
      path: 'sidepanel/sidepanel.html',
      enabled: true
    });
  } else {
    chrome.sidePanel.setOptions({
      tabId: activeInfo.tabId,
      enabled: false
    });
  }
});

chrome.runtime.onMessage.addListener(async (message) => {
  log('Message received: %o', message);
});

chrome.runtime.onStartup.addListener(() => {
  log('Chrome started, initializing extension');
});

chrome.runtime.onSuspend.addListener(() => {
  log('Unloading extension, saving state');
});

chrome.runtime.onSuspendCanceled.addListener(() => {
  log('Extension unload canceled');
});

chrome.runtime.onUpdateAvailable.addListener((updateInfo) => {
  log('Update available: %s', updateInfo.version);
});

chrome.runtime.onInstalled.addListener(
  async (details: chrome.runtime.InstalledDetails) => {
    log('Extension installed/updated: %o', details);
  }
);

chrome.action.onClicked.addListener(handleActionButtonClick);

function getAgentStateByTabId(tabId: number): {
  key: string | undefined;
  state: DerivedState<typeof LensorStateConfig> | undefined;
} {
  const agents = queryAgents({
    context: PorterContext.ContentScript,
    tabId: tabId
  });

  if (!agents || agents.length === 0) {
    return { key: undefined, state: undefined };
  }
  const key = agents[0].info.id;
  const state = get(key);
  return { key, state };
}

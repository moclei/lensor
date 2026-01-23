import { createStore } from 'crann';
import { PorterContext } from 'porter-source';

import { lensorConfig } from '../ui/state-config';
import {
  INACTIVITY_ALARM_PREFIX,
  createInactivityAlarm,
  clearInactivityAlarm
} from '../lib/inactivity-alarm';
import { debug } from '../lib/debug';

const log = debug.sw;

log(
  'Service worker created, version: %s',
  chrome.runtime.getManifest().version
);

// Enable debug logging in development builds only
const IS_DEV = process.env.NODE_ENV === 'development';

// Set up state with Crann v2
const store = createStore(lensorConfig, {
  debug: IS_DEV
});

async function handleActionButtonClick(tab: chrome.tabs.Tab) {
  log('Action button clicked on tab: %o', tab);
  if (!tab.id) return;

  const agents = store.getAgents({
    context: PorterContext.ContentScript,
    tabId: tab.id
  });

  if (agents.length > 0) {
    const agent = agents[0];
    log('Found existing agent for tab: %o', agent);
    const agentState = store.getAgentState(agent.id);
    const isActive = agentState.active;
    log('Toggling active state to: %s', !isActive);
    await store.setState({ active: !isActive }, agent.id);
  } else {
    console.warn('[SW] Action button clicked but no agent found for tab', {
      tabId: tab.id
    });
    await injectContentScript(tab.id);
  }
}

// Subscribe to 'active' changes - manage inactivity alarms
store.subscribe(['active'], (state, changes, agentInfo) => {
  const tabId = agentInfo?.location?.tabId;
  if (tabId === undefined) return;

  if (changes.active === true) {
    // Extension activated - start inactivity alarm
    createInactivityAlarm(tabId);
  } else if (changes.active === false) {
    // Extension deactivated - clear inactivity alarm
    clearInactivityAlarm(tabId);
  }
});

// Subscribe to 'initialized' changes - auto-activate UI when content script connects
store.subscribe(['initialized'], (state, changes, agentInfo) => {
  const tabId = agentInfo?.location?.tabId;

  console.log('[SW] Initialized change detected:', changes.initialized);
  if (tabId === undefined) {
    log('initialized changed but no tabId available');
    return;
  }

  log('Initialized changed: %s', changes.initialized);
  if (changes.initialized === true) {
    const agents = store.getAgents({
      context: PorterContext.ContentScript,
      tabId
    });
    if (agents.length === 0) {
      console.warn('[SW] No agent found for tabId', tabId);
      return;
    }
    const agent = agents[0];
    const agentState = store.getAgentState(agent.id);
    const isActive = agentState.active;
    // Only activate if not already active - never toggle
    // This prevents re-opening after the user closes the extension
    if (!isActive) {
      log('Activating UI (was inactive)');
      store.setState({ active: true }, agent.id);
    } else {
      log('UI already active, skipping activation');
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

// Handle inactivity alarm - close extension when timeout expires
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith(INACTIVITY_ALARM_PREFIX)) {
    return;
  }

  const tabId = parseInt(alarm.name.replace(INACTIVITY_ALARM_PREFIX, ''), 10);
  const agents = store.getAgents({
    context: PorterContext.ContentScript,
    tabId
  });

  if (agents.length > 0) {
    const agent = agents[0];
    const agentState = store.getAgentState(agent.id);
    if (agentState.active) {
      log('Inactivity timeout - closing extension on tab %d', tabId);
      await store.setState({ active: false }, agent.id);
    }
  }
});

chrome.action.onClicked.addListener(handleActionButtonClick);

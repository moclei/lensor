import { createStore } from 'crann';
import { PorterContext } from 'porter-source';

import { lensorConfig } from '../ui/state-config';
import { debug } from '../lib/debug';
import {
  LensorSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY
} from '../settings/types';

const log = debug.sw;

// Alarm name prefix for inactivity timeouts
const INACTIVITY_ALARM_PREFIX = 'inactivity-';

// Throttle alarm resets - minimum time between resets for the same tab
const ALARM_RESET_COOLDOWN_MS = 30000; // 30 seconds
const lastAlarmResetTime: Record<number, number> = {};

/**
 * Get the inactivity timeout setting from storage
 */
async function getInactivityTimeoutMinutes(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([SETTINGS_STORAGE_KEY], (result) => {
      if (result[SETTINGS_STORAGE_KEY]) {
        const settings: LensorSettings = {
          ...DEFAULT_SETTINGS,
          ...result[SETTINGS_STORAGE_KEY]
        };
        resolve(settings.inactivityTimeoutMinutes);
      } else {
        resolve(DEFAULT_SETTINGS.inactivityTimeoutMinutes);
      }
    });
  });
}

/**
 * Create or reset the inactivity alarm for a tab
 */
async function createInactivityAlarm(tabId: number): Promise<void> {
  const timeoutMinutes = await getInactivityTimeoutMinutes();

  // Timeout disabled - don't create alarm
  if (timeoutMinutes <= 0) {
    return;
  }

  const alarmName = `${INACTIVITY_ALARM_PREFIX}${tabId}`;

  // Clear any existing alarm first, then create new one
  await chrome.alarms.clear(alarmName);
  await chrome.alarms.create(alarmName, { delayInMinutes: timeoutMinutes });
}

/**
 * Clear the inactivity alarm for a tab
 */
async function clearInactivityAlarm(tabId: number): Promise<void> {
  const alarmName = `${INACTIVITY_ALARM_PREFIX}${tabId}`;
  await chrome.alarms.clear(alarmName);
}

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

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === 'openSettings') {
    log('Opening settings page');
    chrome.tabs.create({
      url: chrome.runtime.getURL('settings/settings.html')
    });
  }

  if (message.type === 'resetInactivityTimer') {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    // Throttle: Skip if we just reset this tab's alarm recently
    const now = Date.now();
    const lastReset = lastAlarmResetTime[tabId] || 0;
    if (now - lastReset < ALARM_RESET_COOLDOWN_MS) {
      return;
    }

    lastAlarmResetTime[tabId] = now;
    await createInactivityAlarm(tabId);
  }
});

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

// chrome.runtime.onStartup.addListener(() => {
//   console.log('[Lensor Lifecycle] 🌅 Chrome started, initializing extension');
// });

// chrome.runtime.onSuspend.addListener(() => {
//   console.log('[Lensor Lifecycle] 💤 Service worker suspending...');
// });

// chrome.runtime.onSuspendCanceled.addListener(() => {
//   console.log(
//     '[Lensor Lifecycle] ⏰ Suspend canceled - service worker staying alive'
//   );
// });

// chrome.runtime.onUpdateAvailable.addListener((updateInfo) => {
//   console.log(`[Lensor Lifecycle] 📦 Update available: ${updateInfo.version}`);
// });

// chrome.runtime.onInstalled.addListener(
//   async (details: chrome.runtime.InstalledDetails) => {
//     console.log('[Lensor Lifecycle] 🎉 Extension installed/updated:', details);
//   }
// );

chrome.action.onClicked.addListener(handleActionButtonClick);

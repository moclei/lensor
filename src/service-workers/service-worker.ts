import { create, DerivedState } from 'crann';

import { LensorStateConfig } from '../ui/state-config';
import { PorterContext } from 'porter-source';
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
  const hasTabId = agentInfo?.location?.tabId;

  // Handle active state changes - manage inactivity alarms
  if ('active' in changes && hasTabId) {
    const tabId = agentInfo!.location.tabId;
    if (changes.active === true) {
      // Extension activated - start inactivity alarm
      createInactivityAlarm(tabId);
    } else if (changes.active === false) {
      // Extension deactivated - clear inactivity alarm
      clearInactivityAlarm(tabId);
    }
  }

  if ('initialized' in changes) {
    if (!hasTabId) {
      log('initialized changed but no tabId available');
      return;
    }
    log('Initialized changed: %s', changes.initialized);
    if (changes.initialized === true) {
      const { key, state } = getAgentStateByTabId(agentInfo!.location.tabId);
      if (!key) {
        console.warn('[SW] No key found for tabId', agentInfo!.location.tabId);
        return;
      }
      const { active: isActive } = get(key);
      // Only activate if not already active - never toggle
      // This prevents re-opening after the user closes the extension
      if (!isActive) {
        log('Activating UI (was inactive)');
        set({ active: true }, key);
      } else {
        log('UI already active, skipping activation');
      }
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
  const { key, state } = getAgentStateByTabId(tabId);

  if (key && state?.active) {
    log('Inactivity timeout - closing extension on tab %d', tabId);
    set({ active: false }, key);
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Lensor Lifecycle] 🌅 Chrome started, initializing extension');
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('[Lensor Lifecycle] 💤 Service worker suspending...');
});

chrome.runtime.onSuspendCanceled.addListener(() => {
  console.log(
    '[Lensor Lifecycle] ⏰ Suspend canceled - service worker staying alive'
  );
});

chrome.runtime.onUpdateAvailable.addListener((updateInfo) => {
  console.log(`[Lensor Lifecycle] 📦 Update available: ${updateInfo.version}`);
});

chrome.runtime.onInstalled.addListener(
  async (details: chrome.runtime.InstalledDetails) => {
    console.log('[Lensor Lifecycle] 🎉 Extension installed/updated:', details);
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

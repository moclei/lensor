/**
 * Inactivity Alarm Management
 *
 * Manages Chrome Alarms for the auto-shutdown feature. When the extension
 * is active, an alarm is set to automatically deactivate it after a period
 * of inactivity. User activity resets the timer.
 *
 * Used by:
 * - state-config.ts: resetInactivityTimer action
 * - service-worker.ts: active state subscribers, alarm expiration handler
 */

import {
  LensorSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY
} from '../settings/types';

/** Alarm name prefix for inactivity timeouts */
export const INACTIVITY_ALARM_PREFIX = 'inactivity-';

/** Minimum time between alarm resets for the same tab (ms) */
const ALARM_RESET_COOLDOWN_MS = 30000; // 30 seconds

/** Tracks last reset time per tab to throttle alarm API calls */
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
 * Create or reset the inactivity alarm for a tab.
 * Called when the extension activates or when user activity is detected.
 */
export async function createInactivityAlarm(tabId: number): Promise<void> {
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
 * Clear the inactivity alarm for a tab.
 * Called when the extension deactivates.
 */
export async function clearInactivityAlarm(tabId: number): Promise<void> {
  const alarmName = `${INACTIVITY_ALARM_PREFIX}${tabId}`;
  await chrome.alarms.clear(alarmName);
}

/**
 * Reset the inactivity timer for a tab, with throttling.
 * Called on user activity to prevent the extension from timing out.
 * Returns early if the alarm was recently reset (within cooldown period).
 */
export async function resetInactivityTimer(tabId: number): Promise<void> {
  const now = Date.now();
  const lastReset = lastAlarmResetTime[tabId] || 0;

  // Throttle: Skip if we just reset this tab's alarm recently
  if (now - lastReset < ALARM_RESET_COOLDOWN_MS) {
    return;
  }

  lastAlarmResetTime[tabId] = now;
  await createInactivityAlarm(tabId);
}


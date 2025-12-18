import { useState, useEffect, useCallback } from 'react';
import {
  LensorSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY
} from './types';

/**
 * Hook for reading and writing Lensor settings from chrome.storage.sync
 * Works in both the settings page and the main UI
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<LensorSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    chrome.storage.sync.get([SETTINGS_STORAGE_KEY], (result) => {
      if (result[SETTINGS_STORAGE_KEY]) {
        // Merge with defaults to handle any new settings added in updates
        setSettingsState({
          ...DEFAULT_SETTINGS,
          ...result[SETTINGS_STORAGE_KEY]
        });
      }
      setIsLoading(false);
    });
  }, []);

  // Listen for changes from other contexts (e.g., settings page updates while UI is open)
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes[SETTINGS_STORAGE_KEY]) {
        setSettingsState({
          ...DEFAULT_SETTINGS,
          ...changes[SETTINGS_STORAGE_KEY].newValue
        });
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof LensorSettings>(key: K, value: LensorSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      setSettingsState(newSettings);
      chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: newSettings });
    },
    [settings]
  );

  // Update multiple settings at once
  const updateSettings = useCallback(
    (updates: Partial<LensorSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettingsState(newSettings);
      chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: newSettings });
    },
    [settings]
  );

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
    chrome.storage.sync.set({ [SETTINGS_STORAGE_KEY]: DEFAULT_SETTINGS });
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings
  };
}

/**
 * One-time read of settings (for components that don't need reactivity)
 */
export async function getSettings(): Promise<LensorSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([SETTINGS_STORAGE_KEY], (result) => {
      if (result[SETTINGS_STORAGE_KEY]) {
        resolve({
          ...DEFAULT_SETTINGS,
          ...result[SETTINGS_STORAGE_KEY]
        });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    });
  });
}


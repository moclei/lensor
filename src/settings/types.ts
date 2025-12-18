// Settings types for Lensor configuration

export type ColorCopyFormat = 'hex' | 'rgb' | 'hsl';

export interface LensorSettings {
  // Defaults
  defaultZoom: number; // 1-16
  defaultGrid: boolean;
  defaultFisheye: boolean;

  // Appearance
  animationsEnabled: boolean;
  flashEffectEnabled: boolean;
  handleTextureEnabled: boolean;
  handleOpacity: number; // 0-100

  // Color
  colorCopyFormat: ColorCopyFormat;

  // Behavior
  inactivityTimeoutMinutes: number; // 0 = disabled, otherwise 5-60
}

export const DEFAULT_SETTINGS: LensorSettings = {
  // Defaults
  defaultZoom: 3,
  defaultGrid: false,
  defaultFisheye: false,

  // Appearance
  animationsEnabled: true,
  flashEffectEnabled: true,
  handleTextureEnabled: true,
  handleOpacity: 100,

  // Color
  colorCopyFormat: 'hex',

  // Behavior
  inactivityTimeoutMinutes: 20,
};

// Storage key for chrome.storage.sync
export const SETTINGS_STORAGE_KEY = 'lensorSettings';


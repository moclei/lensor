import { createCrannHooks } from 'crann/react';
import { lensorConfig } from '../state-config';

// Enable debug logging in development builds only
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Crann React hooks for Lensor state management.
 *
 * Usage:
 *
 * // Selector pattern - returns selected value, re-renders on change
 * const count = useCrannState(s => s.zoom);
 *
 * // Key pattern - returns [value, setValue] tuple
 * const [zoom, setZoom] = useCrannState('zoom');
 *
 * // Actions - stable references, won't cause re-renders
 * const { captureTab } = useCrannActions();
 * const dataUrl = await captureTab();
 *
 * // Check connection status
 * const isReady = useCrannReady();
 */
export const {
  useCrannState,
  useCrannActions,
  useCrannReady,
  useAgent,
  CrannProvider
} = createCrannHooks(lensorConfig, { debug: IS_DEV });

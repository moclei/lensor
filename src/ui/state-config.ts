import { createConfig, Scope } from 'crann';
import { debug } from '../lib/debug';
import { resetInactivityTimer } from '../lib/inactivity-alarm';

const log = debug.state;

/**
 * Lensor State Configuration (Crann v2)
 *
 * Uses Crann for state synchronization between service worker and content scripts.
 *
 * Scope types:
 * - Scope.Agent: Per-tab state (scoped to each content script instance)
 * - Scope.Shared: Global state (shared across all tabs)
 */
export const lensorConfig = createConfig({
  name: 'lensor',

  active: {
    default: false,
    scope: Scope.Agent
  },
  initialized: {
    default: false,
    scope: Scope.Agent
  },
  hoveredColor: {
    default: 'rgb(87, 102, 111)',
    scope: Scope.Agent
  },
  materialPalette: {
    default: {} as Record<number, string>,
    scope: Scope.Agent
  },
  colorPalette: {
    default: [] as string[],
    scope: Scope.Agent
  },
  showGrid: {
    default: false,
    scope: Scope.Agent
  },
  showFisheye: {
    default: false,
    scope: Scope.Agent
  },
  autoRefresh: {
    default: false,
    scope: Scope.Agent
  },
  zoom: {
    default: 3,
    scope: Scope.Agent
  },
  captureCount: {
    default: 0,
    scope: Scope.Shared
  },
  lensePosition: {
    default: { x: 0, y: 0 },
    scope: Scope.Agent
  },
  isCapturing: {
    default: false,
    scope: Scope.Agent
  },
  isFlashing: {
    default: false,
    scope: Scope.Agent
  },

  // Actions (RPC calls from content script to service worker)
  actions: {
    captureTab: {
      handler: async (ctx) => {
        const tabId = ctx.agentLocation.tabId;
        log('Capturing visible tab: %d', tabId);

        // Get the window ID for this tab
        const tab = await chrome.tabs.get(tabId);
        const windowId = tab.windowId;

        // Capture the visible area of the tab
        const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
          format: 'png'
        });

        log('Tab captured, data URL length: %d', dataUrl.length);
        return dataUrl;
      }
    },

    openSettings: {
      handler: async () => {
        log('Opening settings page');
        chrome.tabs.create({
          url: chrome.runtime.getURL('settings/settings.html')
        });
      }
    },

    resetInactivityTimer: {
      handler: async (ctx) => {
        await resetInactivityTimer(ctx.agentLocation.tabId);
      }
    }
  }
});

// Export the config type for use in other files
export type LensorConfig = typeof lensorConfig;

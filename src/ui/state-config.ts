import { Partition } from 'crann';
import { BrowserLocation } from 'porter-source';
import { debug } from '../lib/debug';

const log = debug.state;

export const LensorStateConfig = {
  active: {
    default: false,
    partition: Partition.Instance
  },
  initialized: {
    default: false,
    partition: Partition.Instance
  },
  // DEPRECATED: mediaStreamId is no longer used with captureVisibleTab approach
  // Keeping for now in case we need to revert to MediaStream approach
  // mediaStreamId: {
  //   default: null as string | null,
  //   partition: Partition.Instance
  // },
  hoveredColor: {
    default: 'rgb(87, 102, 111)',
    partition: Partition.Instance
  },
  materialPalette: {
    default: {} as Record<number, string>,
    partition: Partition.Instance
  },
  colorPalette: {
    default: [] as string[],
    partition: Partition.Instance
  },
  showGrid: {
    default: false,
    partition: Partition.Instance
  },
  showFisheye: {
    default: false,
    partition: Partition.Instance
  },
  autoRefresh: {
    default: false,
    partition: Partition.Instance
  },
  zoom: {
    default: 3,
    partition: Partition.Instance
  },
  captureCount: {
    default: 0,
    partition: Partition.Service
  },
  lensePosition: {
    default: { x: 0, y: 0 },
    partition: Partition.Instance
  },
  isCapturing: {
    default: false,
    partition: Partition.Instance
  },
  isFlashing: {
    default: false,
    partition: Partition.Instance
  },
  // DEPRECATED: getMediaStreamId is no longer used with captureVisibleTab approach
  // Keeping for now in case we need to revert to MediaStream approach
  // getMediaStreamId: {
  //   handler: async (
  //     state: any,
  //     setState: (newState: Partial<any>) => Promise<void>,
  //     target: BrowserLocation
  //   ) => {
  //     log('Getting media stream ID for tab: %d', target.tabId);
  //     const mediaStreamId = await (chrome.tabCapture as any).getMediaStreamId({
  //       consumerTabId: target.tabId,
  //       targetTabId: target.tabId
  //     });
  //     log('Media stream ID obtained');
  //     return mediaStreamId;
  //   },
  //   validate: (amount: number) => {
  //     if (amount < 0) throw new Error('Amount must be positive');
  //   }
  // },
  // New action: Capture visible tab as a single screenshot (no video stream)
  captureTab: {
    handler: async (
      state: any,
      setState: (newState: Partial<any>) => Promise<void>,
      target: BrowserLocation
    ) => {
      log('Capturing visible tab: %d', target.tabId);

      // Get the window ID for this tab
      const tab = await chrome.tabs.get(target.tabId);
      const windowId = tab.windowId;

      // Capture the visible area of the tab
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: 'png'
      });

      log('Tab captured, data URL length: %d', dataUrl.length);
      return dataUrl;
    }
  }
};

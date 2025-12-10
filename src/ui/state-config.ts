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
  mediaStreamId: {
    default: null as string | null,
    partition: Partition.Instance
  },
  isSidepanelShown: {
    default: false,
    partition: Partition.Instance
  },
  hoveredColor: {
    default: 'rgb(87, 102, 111)',
    partition: Partition.Service
  },
  materialPalette: {
    default: {} as Record<number, string>,
    partition: Partition.Service
  },
  colorPalette: {
    default: [] as string[],
    partition: Partition.Service
  },
  showGrid: {
    default: false,
    partition: Partition.Instance
  },
  showFisheye: {
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
    partition: Partition.Service
  },
  getMediaStreamId: {
    handler: async (
      state: any,
      setState: (newState: Partial<any>) => Promise<void>,
      target: BrowserLocation
    ) => {
      log('Getting media stream ID for tab: %d', target.tabId);
      const mediaStreamId = await (chrome.tabCapture as any).getMediaStreamId({
        consumerTabId: target.tabId,
        targetTabId: target.tabId
      });

      log('Media stream ID obtained');
      return mediaStreamId;
    },
    validate: (amount: number) => {
      if (amount < 0) throw new Error('Amount must be positive');
    }
  }
};

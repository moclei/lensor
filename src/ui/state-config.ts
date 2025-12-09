import { Partition } from 'crann';
import { BrowserLocation } from 'porter-source';

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
      console.log('Getting media stream id for target: ', { target });
      const mediaStreamId = await (chrome.tabCapture as any).getMediaStreamId({
        consumerTabId: target.tabId,
        targetTabId: target.tabId
      });

      console.log(
        'Crann instance ready was the one we wanted. Setting mediaStreamId'
      );
      return mediaStreamId;
    },
    validate: (amount: number) => {
      if (amount < 0) throw new Error('Amount must be positive');
    }
  }
};

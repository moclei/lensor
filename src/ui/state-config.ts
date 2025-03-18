import { Partition } from 'crann';

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
  showGrid: {
    default: false,
    partition: Partition.Service
  },
  showFisheye: {
    default: false,
    partition: Partition.Service
  },
  zoom: {
    default: 1,
    partition: Partition.Service
  },
  pixelScalingEnabled: {
    default: false,
    partition: Partition.Service
  },
  imageCropX: {
    default: 0,
    partition: Partition.Service
  },
  imageCropY: {
    default: 0,
    partition: Partition.Service
  },
  captureCount: {
    default: 0,
    partition: Partition.Service
  }
};

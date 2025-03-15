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
    default: true,
    partition: Partition.Service
  },
  showFisheye: {
    default: true,
    partition: Partition.Service
  },
  zoom: {
    default: 2,
    partition: Partition.Service
  },
  pixelScalingEnabled: {
    default: true,
    partition: Partition.Service
  }
};

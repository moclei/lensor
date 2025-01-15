import { Partition } from 'crann'

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
        partition: Partition.Common
    },
    showGrid: {
        default: true,
        partition: Partition.Common
    },
    showFisheye: {
        default: true,
        partition: Partition.Common
    },
}
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
}
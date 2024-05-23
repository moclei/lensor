import { Partition } from "weirwood";

export const LensorStateConfig = {
    active: {
        default: false,
        partition: Partition.Instance
    },
    initialized: {
        default: false,
        partition: Partition.Instance
    },
}
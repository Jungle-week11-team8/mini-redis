import type { ExpireInput, Reply, Store } from "../types.ts";

export function expire(store: Store, input: ExpireInput): Reply {
    return store.setExpiry(input.key, input.ttl)
        ? { type: "success" }
        : { type: "nil" };
}

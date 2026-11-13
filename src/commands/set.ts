import type { Reply, SetInput, Store } from "../types.ts";

export function set(store: Store, input: SetInput): Reply {
  if (input.nx && store.has(input.key)) return { type: "nil" };
  store.set(input.key, input.value);
  if (input.ttl !== undefined) store.setExpiry(input.key, input.ttl);
  return { type: "success" };
}

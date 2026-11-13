import type { GetInput, Reply, Store } from "../types.ts";

export function get(store: Store, input: GetInput): Reply {
  const value = store.get(input.key);
  return value === null ? { type: "nil" } : { type: "value", value };
}

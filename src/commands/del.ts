import type { DelInput, Reply, Store } from "../types.ts";

export function del(store: Store, input: DelInput): Reply {
  return { type: "count", value: store.delete(input.key) ? 1 : 0 };
}

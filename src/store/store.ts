import type { Store } from "../types.ts";

export function createStore(): Store {
  const data = new Map<string, string>();

  return {
    get(key) {
      return data.get(key) ?? null;
    },
    set(key, value) {
      data.set(key, value);
    },
  };
}

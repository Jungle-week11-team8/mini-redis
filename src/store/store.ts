import type { Store } from "../types.ts";

type Entry = { value: string; expiresAt?: number };

export function createStore(): Store {
  const data = new Map<string, Entry>();

  // Every method reads through here so an expired key never exists (lazy expiry).
  function lookup(key: string): Entry | undefined {
    const entry = data.get(key);
    if (entry?.expiresAt !== undefined && Date.now() >= entry.expiresAt) {
      data.delete(key);
      return undefined;
    }
    return entry;
  }

  return {
    get(key) {
      return lookup(key)?.value ?? null;
    },
    set(key, value) {
      data.set(key, { value });
    },
    setExpiry(key, ms) {
      const entry = lookup(key);
      if (!entry) return false;
      entry.expiresAt = Date.now() + ms;
      return true;
    },
  };
}

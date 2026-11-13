export type CommandName = "SET" | "GET" | "DEL" | "EXPIRE";

// Values are strings; TTL is in milliseconds. SET options: nx, ttl.
// A nil reply is represented as JSON null at the HTTP boundary.
export type Reply =
  | { type: "success" }
  | { type: "nil" }
  | { type: "value"; value: string }
  | { type: "count"; value: number };

// Synchronous on purpose: command atomicity relies on no await in commands/store.
// Methods are added one per command as each command is built.
export type Store = {
  get(key: string): string | null;
  has(key: string): boolean;
  // true only if a live (non-expired) key was removed.
  delete(key: string): boolean;
  // Overwrites the value and clears any TTL.
  set(key: string, value: string): void;
  // Expires the key ms from now; false if the key does not exist.
  setExpiry(key: string, ms: number): boolean;
};

// Command inputs arrive already validated by protocol/.
export type SetInput = {
  key: string;
  value: string;
  nx?: boolean;
  ttl?: number;
};
export type GetInput = { key: string };
export type DelInput = { key: string };
export type ExpireInput = { key: string; ttl: number };

// Error response shape is not finalized (decided in the protocol unit).

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
  // Overwrites the value and clears any TTL.
  set(key: string, value: string): void;
  // Expires the key ms from now; false if the key does not exist.
  setExpiry(key: string, ms: number): boolean;
};

// Command and error response shapes are not finalized.

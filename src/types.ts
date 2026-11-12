export type CommandName = "SET" | "GET" | "DEL" | "EXPIRE";

// Values are strings; TTL is in milliseconds. SET options: nx, ttl.
// A nil reply is represented as JSON null at the HTTP boundary.
export type Reply =
  | { type: "success" }
  | { type: "nil" }
  | { type: "value"; value: string }
  | { type: "count"; value: number };

// Command, Store, and error response shapes are not finalized.

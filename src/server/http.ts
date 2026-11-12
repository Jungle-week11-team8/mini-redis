import { createServer } from "node:http";

export function createMiniRedisServer() {
  return createServer((request, response) => {
    // Startup check only; command endpoints are not finalized.
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ status: "ok" }));
      return;
    }

    response.writeHead(404);
    response.end();
  });
}

import { createMiniRedisServer } from "./server/http.ts";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);
const server = createMiniRedisServer();

server.on("error", (error: Error) => {
  console.error("[mini-redis]", error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`Mini Redis HTTP server: http://${host}:${port}`);
});

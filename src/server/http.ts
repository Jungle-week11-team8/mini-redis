import { createServer, type IncomingMessage } from "node:http";
import type { HttpResponse, Store } from "../types.ts";
import { handle } from "../protocol/http.ts";

const MAX_BODY_BYTES = 1024 * 1024;

export function createMiniRedisServer(store: Store) {
    return createServer(async (request, response) => {
        let result: HttpResponse;
        try {
            const body = await readBody(request);
            result =
                body === null
                    ? { status: 413, body: { error: "request body too large" } }
                    : handle(
                          store,
                          request.method ?? "",
                          request.url ?? "",
                          body,
                      );
        } catch (error) {
            console.error("[mini-redis]", error);
            result = { status: 500, body: { error: "internal error" } };
        }

        response.writeHead(result.status, {
            "Content-Type": "application/json; charset=utf-8",
        });
        response.end(JSON.stringify(result.body));
    });
}

// Returns null when the body exceeds the limit; the rest is drained, not stored.
async function readBody(request: IncomingMessage): Promise<string | null> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size <= MAX_BODY_BYTES) chunks.push(chunk);
    }
    return size > MAX_BODY_BYTES
        ? null
        : Buffer.concat(chunks).toString("utf8");
}

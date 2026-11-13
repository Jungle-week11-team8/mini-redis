import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createClient } from "../src/client/client.ts";
import { createMiniRedisServer } from "../src/server/http.ts";
import { createStore } from "../src/store/store.ts";

const server = createMiniRedisServer(createStore());
let client: ReturnType<typeof createClient>;

before(async () => {
    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = server.address() as AddressInfo;
    client = createClient(`http://127.0.0.1:${port}`);
});
after(() => server.close());

test("client runs SET/GET/EXPIRE/DEL against the server", async () => {
    assert.equal(await client.set("token", "abc"), "OK");
    assert.equal(await client.set("token", "xyz", { nx: true }), null);
    assert.equal(await client.get("token"), "abc");
    assert.equal(await client.expire("token", 60_000), "OK");
    assert.equal(await client.del("token"), 1);
    assert.equal(await client.get("token"), null);
    assert.equal(await client.expire("token", 1000), null);
});

test("client throws on error responses", async () => {
    await assert.rejects(client.get(""), /mini-redis 400: invalid field: key/);
});

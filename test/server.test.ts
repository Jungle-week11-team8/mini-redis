import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createMiniRedisServer } from "../src/server/http.ts";
import { createStore } from "../src/store/store.ts";

const server = createMiniRedisServer(createStore());
let baseUrl = "";

before(async () => {
    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
    );
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

test("SET then GET over HTTP", async () => {
    const setResponse = await fetch(`${baseUrl}/set`, {
        method: "POST",
        body: JSON.stringify({ key: "token", value: "abc" }),
    });
    assert.equal(setResponse.status, 200);
    assert.deepEqual(await setResponse.json(), { result: "OK" });

    const getResponse = await fetch(`${baseUrl}/get`, {
        method: "POST",
        body: JSON.stringify({ key: "token" }),
    });
    assert.deepEqual(await getResponse.json(), { result: "abc" });
});

test("body over 1MB returns 413", async () => {
    const response = await fetch(`${baseUrl}/set`, {
        method: "POST",
        body: "x".repeat(1024 * 1024 + 1),
    });
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), {
        error: "request body too large",
    });
});

test("concurrent SET NX on one key: exactly one request wins", async () => {
    const responses = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
            fetch(`${baseUrl}/set`, {
                method: "POST",
                body: JSON.stringify({ key: "race", value: `v${i}`, nx: true }),
            }).then((response) => response.json()),
        ),
    );
    const winners = responses.filter((body) => body.result === "OK");
    assert.equal(winners.length, 1);

    const getResponse = await fetch(`${baseUrl}/get`, {
        method: "POST",
        body: JSON.stringify({ key: "race" }),
    });
    const stored = (await getResponse.json()).result;
    const winnerIndex = responses.findIndex((body) => body.result === "OK");
    assert.equal(stored, `v${winnerIndex}`);
});

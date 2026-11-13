import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store/store.ts";
import { expire } from "../src/commands/expire.ts";

beforeEach(() => mock.timers.enable({ apis: ["Date"], now: 0 }));
afterEach(() => mock.timers.reset());

test("EXPIRE returns success and expires an existing key", () => {
    const store = createStore();
    store.set("k", "a");
    assert.deepEqual(expire(store, { key: "k", ttl: 1000 }), {
        type: "success",
    });
    mock.timers.tick(1000);
    assert.equal(store.get("k"), null);
});

test("EXPIRE returns nil for a missing key", () => {
    const store = createStore();
    assert.deepEqual(expire(store, { key: "k", ttl: 1000 }), { type: "nil" });
});

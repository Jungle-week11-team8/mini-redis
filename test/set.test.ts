import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store/store.ts";
import { set } from "../src/commands/set.ts";

beforeEach(() => mock.timers.enable({ apis: ["Date"], now: 0 }));
afterEach(() => mock.timers.reset());

test("SET stores the value and overwrites", () => {
    const store = createStore();
    assert.deepEqual(set(store, { key: "k", value: "a" }), { type: "success" });
    assert.deepEqual(set(store, { key: "k", value: "b" }), { type: "success" });
    assert.equal(store.get("k"), "b");
});

test("SET NX does not overwrite an existing key", () => {
    const store = createStore();
    set(store, { key: "k", value: "a" });
    assert.deepEqual(set(store, { key: "k", value: "b", nx: true }), {
        type: "nil",
    });
    assert.equal(store.get("k"), "a");
});

test("SET NX stores when the key is missing or expired", () => {
    const store = createStore();
    assert.deepEqual(
        set(store, { key: "k", value: "a", nx: true, ttl: 1000 }),
        {
            type: "success",
        },
    );
    mock.timers.tick(1000);
    assert.deepEqual(set(store, { key: "k", value: "b", nx: true }), {
        type: "success",
    });
    assert.equal(store.get("k"), "b");
});

test("SET with ttl expires the key", () => {
    const store = createStore();
    set(store, { key: "k", value: "a", ttl: 1000 });
    mock.timers.tick(999);
    assert.equal(store.get("k"), "a");
    mock.timers.tick(1);
    assert.equal(store.get("k"), null);
});

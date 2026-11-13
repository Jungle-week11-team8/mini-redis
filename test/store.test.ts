import { test, describe, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store/store.ts";

test("get returns the value that was set", () => {
    const store = createStore();
    store.set("token", "abc");
    assert.equal(store.get("token"), "abc");
});

test("set overwrites an existing key", () => {
    const store = createStore();
    store.set("token", "old");
    store.set("token", "new");
    assert.equal(store.get("token"), "new");
});

test("get returns null for a missing key", () => {
    const store = createStore();
    assert.equal(store.get("missing"), null);
});

test("empty string value is stored, not treated as missing", () => {
    const store = createStore();
    store.set("k", "");
    assert.equal(store.get("k"), "");
});

describe("ttl", () => {
    beforeEach(() => mock.timers.enable({ apis: ["Date"], now: 0 }));
    afterEach(() => mock.timers.reset());

    test("key exists until just before expiry and is gone at expiry", () => {
        const store = createStore();
        store.set("token", "abc");
        assert.equal(store.setExpiry("token", 1000), true);
        mock.timers.tick(999);
        assert.equal(store.get("token"), "abc");
        mock.timers.tick(1);
        assert.equal(store.get("token"), null);
    });

    test("setExpiry on a missing key returns false and creates nothing", () => {
        const store = createStore();
        assert.equal(store.setExpiry("missing", 1000), false);
        assert.equal(store.get("missing"), null);
    });

    test("setExpiry on an expired key returns false", () => {
        const store = createStore();
        store.set("token", "abc");
        store.setExpiry("token", 1000);
        mock.timers.tick(1000);
        assert.equal(store.setExpiry("token", 1000), false);
    });

    test("setExpiry again replaces the ttl from now", () => {
        const store = createStore();
        store.set("token", "abc");
        store.setExpiry("token", 1000);
        mock.timers.tick(800);
        store.setExpiry("token", 1000);
        mock.timers.tick(999);
        assert.equal(store.get("token"), "abc");
        mock.timers.tick(1);
        assert.equal(store.get("token"), null);
    });

    test("set clears an existing ttl", () => {
        const store = createStore();
        store.set("token", "old");
        store.setExpiry("token", 1000);
        store.set("token", "new");
        mock.timers.tick(5000);
        assert.equal(store.get("token"), "new");
    });
});

describe("has and delete", () => {
    beforeEach(() => mock.timers.enable({ apis: ["Date"], now: 0 }));
    afterEach(() => mock.timers.reset());

    test("has reports live keys only", () => {
        const store = createStore();
        assert.equal(store.has("token"), false);
        store.set("token", "abc");
        assert.equal(store.has("token"), true);
        store.setExpiry("token", 1000);
        mock.timers.tick(1000);
        assert.equal(store.has("token"), false);
    });

    test("delete removes a live key and returns true", () => {
        const store = createStore();
        store.set("token", "abc");
        assert.equal(store.delete("token"), true);
        assert.equal(store.get("token"), null);
        assert.equal(store.delete("token"), false);
    });

    test("delete on an expired key returns false", () => {
        const store = createStore();
        store.set("token", "abc");
        store.setExpiry("token", 1000);
        mock.timers.tick(1000);
        assert.equal(store.delete("token"), false);
    });
});

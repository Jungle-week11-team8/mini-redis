import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store/store.ts";
import { del } from "../src/commands/del.ts";

test("DEL returns 1 for an existing key and 0 for a missing key", () => {
    const store = createStore();
    store.set("k", "a");
    assert.deepEqual(del(store, { key: "k" }), { type: "count", value: 1 });
    assert.equal(store.get("k"), null);
    assert.deepEqual(del(store, { key: "k" }), { type: "count", value: 0 });
});

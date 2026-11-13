import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store/store.ts";
import { get } from "../src/commands/get.ts";

test("GET returns value or nil", () => {
  const store = createStore();
  assert.deepEqual(get(store, { key: "k" }), { type: "nil" });
  store.set("k", "a");
  assert.deepEqual(get(store, { key: "k" }), { type: "value", value: "a" });
});

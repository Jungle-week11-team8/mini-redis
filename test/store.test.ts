import { test } from "node:test";
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

import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store/store.ts";
import { handle } from "../src/protocol/http.ts";

function post(path: string, body: unknown, store = createStore()) {
    return handle(store, "POST", path, JSON.stringify(body));
}

test("SET then GET round-trips through result", () => {
    const store = createStore();
    assert.deepEqual(post("/set", { key: "k", value: "a" }, store), {
        status: 200,
        body: { result: "OK" },
    });
    assert.deepEqual(post("/get", { key: "k" }, store).body, { result: "a" });
    assert.deepEqual(post("/get", { key: "x" }, store).body, { result: null });
});

test("SET NX on an existing key returns null", () => {
    const store = createStore();
    post("/set", { key: "k", value: "a" }, store);
    assert.deepEqual(
        post("/set", { key: "k", value: "b", nx: true }, store).body,
        {
            result: null,
        },
    );
});

test("DEL returns a count and EXPIRE returns OK or null", () => {
    const store = createStore();
    post("/set", { key: "k", value: "a" }, store);
    assert.deepEqual(post("/expire", { key: "k", ttl: 1000 }, store).body, {
        result: "OK",
    });
    assert.deepEqual(post("/del", { key: "k" }, store).body, { result: 1 });
    assert.deepEqual(post("/expire", { key: "k", ttl: 1000 }, store).body, {
        result: null,
    });
});

test("empty value is allowed", () => {
    assert.equal(post("/set", { key: "k", value: "" }).status, 200);
});

test("validation failures return 400 with an error message", () => {
    const cases: [string, unknown, string][] = [
        ["/set", { key: "", value: "a" }, "invalid field: key"],
        ["/set", { key: 1, value: "a" }, "invalid field: key"],
        ["/set", { key: "k", value: 1 }, "invalid field: value"],
        ["/set", { key: "k" }, "missing field: value"],
        ["/set", { key: "k", value: "a", nx: "yes" }, "invalid field: nx"],
        ["/set", { key: "k", value: "a", tll: 1000 }, "unknown field: tll"],
        ["/set", { key: "k", value: "a", ttl: 0 }, "invalid field: ttl"],
        ["/set", { key: "k", value: "a", ttl: -1 }, "invalid field: ttl"],
        ["/set", { key: "k", value: "a", ttl: 1.5 }, "invalid field: ttl"],
        ["/expire", { key: "k", ttl: "1000" }, "invalid field: ttl"],
        ["/expire", { key: "k" }, "missing field: ttl"],
        ["/get", ["k"], "body must be a JSON object"],
        ["/get", null, "body must be a JSON object"],
    ];
    for (const [path, body, message] of cases) {
        assert.deepEqual(post(path, body), {
            status: 400,
            body: { error: message },
        });
    }
});

test("invalid JSON returns 400", () => {
    assert.deepEqual(handle(createStore(), "POST", "/get", "{"), {
        status: 400,
        body: { error: "invalid JSON" },
    });
});

test("unknown path is 404 and wrong method is 405", () => {
    const store = createStore();
    assert.equal(handle(store, "POST", "/nope", "{}").status, 404);
    assert.equal(handle(store, "POST", "/constructor", "{}").status, 404);
    assert.equal(handle(store, "GET", "/get", "").status, 405);
    assert.equal(handle(store, "POST", "/health", "").status, 405);
});

test("GET /health returns ok", () => {
    assert.deepEqual(handle(createStore(), "GET", "/health", ""), {
        status: 200,
        body: { status: "ok" },
    });
});

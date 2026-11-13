import type {
    DelInput,
    ExpireInput,
    GetInput,
    HttpResponse,
    Reply,
    SetInput,
    Store,
} from "../types.ts";
import { set } from "../commands/set.ts";
import { get } from "../commands/get.ts";
import { del } from "../commands/del.ts";
import { expire } from "../commands/expire.ts";

type Input = Record<string, unknown>;

type Route = {
    required: string[];
    optional: string[];
    // Input is cast only after validate() has checked every field.
    run: (store: Store, input: Input) => Reply;
};

const routes: Record<string, Route> = {
    "/set": {
        required: ["key", "value"],
        optional: ["nx", "ttl"],
        run: (store, input) => set(store, input as SetInput),
    },
    "/get": {
        required: ["key"],
        optional: [],
        run: (store, input) => get(store, input as GetInput),
    },
    "/del": {
        required: ["key"],
        optional: [],
        run: (store, input) => del(store, input as DelInput),
    },
    "/expire": {
        required: ["key", "ttl"],
        optional: [],
        run: (store, input) => expire(store, input as ExpireInput),
    },
};

// A field name means the same thing in every command.
const fieldChecks: Record<string, (value: unknown) => boolean> = {
    key: (value) => typeof value === "string" && value !== "",
    value: (value) => typeof value === "string",
    nx: (value) => typeof value === "boolean",
    ttl: (value) => Number.isSafeInteger(value) && (value as number) >= 1,
};

export function handle(
    store: Store,
    method: string,
    path: string,
    body: string,
): HttpResponse {
    if (path === "/health") {
        return method === "GET"
            ? { status: 200, body: { status: "ok" } }
            : error(405, "method not allowed");
    }

    if (!Object.hasOwn(routes, path)) return error(404, "not found");
    const route = routes[path];
    if (method !== "POST") return error(405, "method not allowed");

    let input: unknown;
    try {
        input = JSON.parse(body);
    } catch {
        return error(400, "invalid JSON");
    }

    const problem = validate(input, route);
    if (problem) return error(400, problem);

    const reply = route.run(store, input as Input);
    return { status: 200, body: { result: toResult(reply) } };
}

function validate(input: unknown, route: Route): string | null {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return "body must be a JSON object";
    }
    for (const field of Object.keys(input)) {
        if (
            !route.required.includes(field) &&
            !route.optional.includes(field)
        ) {
            return `unknown field: ${field}`;
        }
    }
    for (const field of route.required) {
        if (!(field in input)) return `missing field: ${field}`;
    }
    for (const [field, value] of Object.entries(input)) {
        if (!fieldChecks[field](value)) return `invalid field: ${field}`;
    }
    return null;
}

function toResult(reply: Reply): string | number | null {
    switch (reply.type) {
        case "success":
            return "OK";
        case "nil":
            return null;
        case "value":
        case "count":
            return reply.value;
    }
}

function error(status: number, message: string): HttpResponse {
    return { status, body: { error: message } };
}

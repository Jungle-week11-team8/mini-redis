import type { ResponseBody, SetInput } from "../types.ts";

// HTTP client for the Mini Redis server. Error responses (4xx/5xx) are thrown.
export function createClient(baseUrl: string) {
    async function call(command: string, body: object) {
        const response = await fetch(`${baseUrl}/${command}`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        const json = (await response.json()) as ResponseBody;
        if ("error" in json) {
            throw new Error(`mini-redis ${response.status}: ${json.error}`);
        }
        return (json as { result: string | number | null }).result;
    }

    return {
        // "OK", or null when nx is set and the key already exists.
        set: (
            key: string,
            value: string,
            options?: Omit<SetInput, "key" | "value">,
        ) => call("set", { key, value, ...options }) as Promise<"OK" | null>,
        get: (key: string) => call("get", { key }) as Promise<string | null>,
        // 1 if a live key was removed, otherwise 0.
        del: (key: string) => call("del", { key }) as Promise<number>,
        // "OK", or null when the key does not exist.
        expire: (key: string, ttl: number) =>
            call("expire", { key, ttl }) as Promise<"OK" | null>,
    };
}

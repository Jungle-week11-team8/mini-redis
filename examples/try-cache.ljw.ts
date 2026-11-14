const CACHE = "http://127.0.0.1:3000";

async function cache(command: string, body: object) {
    const response = await fetch(`${CACHE}/${command}`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    return (await response.json()).result;
}

// 진짜 DB 대신 100ms 걸리는 조회
async function findUserByTokenFromDb(token: string) {
    await new Promise((resolve) => setTimeout(resolve,100));
    return JSON.stringify({ userId: 1, token });
}

async function checkToken(token: string) {
    const cached = await cache("get", { key: `token:${token}`});
    if (cached !== null)
        return { from: "cache", user: JSON.parse(cached) };

    const user = await findUserByTokenFromDb(token);
    await cache("set", { key: `token:${token}`, value: user, ttl: 60_000 });
    return { from: "db", user: JSON.parse(user) };
}

async function removeToken(token: string) {
    const deleted = await cache("del", { key: `token:${token}` });
    console.log("삭제 개수:", deleted);
}

for (let i = 0; i < 3; i++) {
    console.time("checkToken");
    console.log(await checkToken("ljw 1"));
    console.log(await checkToken("ljw 2"));
    console.timeEnd("checkToken");
}

await removeToken("ljw 1");
await removeToken("ljw 2");

await removeToken("ljw 1");
await removeToken("ljw 2");
export {};
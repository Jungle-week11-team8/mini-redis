// try-cache.ts
const CACHE = "http://127.0.0.1:3000";

async function cache(command: string, body: object) {
    const response = await fetch(`${CACHE}/${command}`,{
        method: "POST",
        body: JSON.stringify(body),
    });
    return (await response.json()).result;
}

// DB 조회 흉내냄
async function findUserByTokenFromDb(token: string){
    await new Promise((resolve)=>setTimeout(resolve, 100));
    return JSON.stringify({ userId: 1, token });
}

async function checkToken(token: string) {
    const cached =await cache("get",{key: `token: ${token}`});
    if (cached !== null) return {from: "cache", user: JSON.parse(cached) };

    const user = await findUserByTokenFromDb(token);
    await cache("set",{key: `token:${token}`, value: user, ttl:60_000 });
    return { from: "db", user: JSON.parse(user)};
}

for (let i=0; i<3; i++){
    console.time("checkToken");
    console.log(await checkToken("abc"));
    console.timeEnd("checkToken");
}

export {};
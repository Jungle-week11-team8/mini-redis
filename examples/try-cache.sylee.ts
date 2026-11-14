// try-cache.ts
const CACHE = "http://127.0.0.1:3000";

async function cache(command: string, body: object) {
    const response = await fetch(`${CACHE}/${command}`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    return (await response.json()).result;
}

async function findUserByTokenFromDb(token: string) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return JSON.stringify({ userId: 1, token});
}

async function checkToken(token: string) {
    const cached = await cache("get", { key: `token:${token}` });
    if (cached !== null) return { from: "cache", user: JSON.parse(cached)};

    const user = await findUserByTokenFromDb(token);
    await cache("set", { key: `token:${token}`, value: user, ttl: 60_000 });
    return { from: "db", user: JSON.parse(user) };
}

// async function checkToken2(token: string) {
//     // const cached = await cache("get", { key: `token:${token}` });
//     // if (cached !== null) return { from: "cache", user: JSON.parse(cached)};

//     const user = await findUserByTokenFromDb(token);
//     await cache("set", { key: `token:${token}`, value: user, nx: true, ttl: 60_000 });
//     return { from: "db", user: JSON.parse(user) };
// }

async function checkToken2(token: string) {
    const user = JSON.stringify({ userId: 1, token, at: Date.now() }); // 매번 다른 값
    // user = '{"userId":1,"token":"22","at":1763100000000}'  
    const setResult = await cache("set", { key: `token:${token}`, value: user, nx: true, ttl: 60_000 });
    const stored = await cache("get", { key: `token:${token}` });
    return { setResult, stored: JSON.parse(stored) };
}


for (let i = 0; i <3; i++) {
    console.time("checkToken");
    console.log(await checkToken("abc"));
    console.log(await checkToken2("abc"));
    console.timeEnd("checkToken");
}





export {};


/*

(base) iseoyeon@iseoyeon-ui-MacBookPro mini-redis % node examples/try-cache.sylee.ts
{ from: 'db', user: { userId: 1, token: 'abc' } }
{ setResult: null, stored: { userId: 1, token: 'abc' } }
checkToken: 128.563ms
{ from: 'cache', user: { userId: 1, token: 'abc' } }
{ setResult: null, stored: { userId: 1, token: 'abc' } }
checkToken: 6.145ms
{ from: 'cache', user: { userId: 1, token: 'abc' } }
{ setResult: null, stored: { userId: 1, token: 'abc' } }
checkToken: 6.236ms


(base) iseoyeon@iseoyeon-ui-MacBookPro mini-redis % node examples/try-cache.sylee.ts
{ from: 'db', user: { userId: 1, token: 'abc' } }
{
  setResult: 'OK',
  stored: { userId: 1, token: 'abc', at: 1794582779111 }
}
checkToken: 127.314ms
{ from: 'cache', user: { userId: 1, token: 'abc', at: 1794582779111 } }
{
  setResult: 'OK',
  stored: { userId: 1, token: 'abc', at: 1794582779117 }
}
checkToken: 6.1ms
{ from: 'cache', user: { userId: 1, token: 'abc', at: 1794582779117 } }
{
  setResult: 'OK',
  stored: { userId: 1, token: 'abc', at: 1794582779124 }
}
checkToken: 6.894ms

*/
# 매뉴얼

[← README로 돌아가기](../README.md)

## 1. 프로젝트 정보

### 사용 환경

- Node.js 24 LTS (`.nvmrc`). 버전 관리는 fnm을 사용합니다.
- TypeScript는 빌드 없이 `node src/index.ts`로 바로 실행합니다.
- Windows와 macOS에서 같은 명령으로 동작합니다.
- 개발 의존성은 `typescript`, `@types/node`뿐입니다.

### 설치 (Getting Started)

**1. fnm 설치**

- Windows: `winget install Schniz.fnm`
- macOS: `brew install fnm`

**2. 셸에 fnm 연결 (최초 1회)**

Windows PowerShell에서 다음 명령으로 현재 터미널에 연결합니다. 자동으로 적용하려면 PowerShell 프로필에 같은 내용을 추가합니다.

```powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
```

macOS는 `~/.zshrc`에 다음을 추가하고 새 터미널을 엽니다.

```zsh
eval "$(fnm env --use-on-cd --shell zsh)"
```

**3. Node 설치와 의존성 설치**

```bash
fnm install
fnm use
npm ci
```

**4. 환경 변수 파일 복사**

- Windows PowerShell: `Copy-Item .env.example .env`
- macOS: `cp .env.example .env`

`.env`의 `HOST`(기본 `127.0.0.1`)와 `PORT`(기본 `3000`)로 주소를 바꿀 수 있습니다.

**5. 서버 실행**

```bash
npm run dev     # 파일이 바뀌면 자동 재시작
npm start       # 한 번 실행
```

`http://127.0.0.1:3000/health`에서 `{ "status": "ok" }`가 오면 정상입니다.


### 테스트와 타입 검사

```bash
npm test            # node --test, 명령·계층별 테스트
npm run typecheck   # tsc --noEmit, 실행과 분리된 타입 검사
```

### 실제 Redis 비교 환경

Docker Desktop을 켠 상태에서 `npm run redis:compare`를 실행하면 실제 Redis가 로컬 포트 6380에 뜹니다. 종료하면 컨테이너는 삭제됩니다. 동작이 애매할 때 정답지로 비교하는 용도입니다.

### API

명령은 모두 `POST`이고, body는 JSON 객체입니다.

| 주소 | body | 성공 시 `result` |
| --- | --- | --- |
| `POST /set` | `{ key, value, nx?, ttl? }` | `"OK"`, NX인데 키가 이미 있으면 `null` |
| `POST /get` | `{ key }` | 값, 없거나 만료됐으면 `null` |
| `POST /del` | `{ key }` | 지운 개수 `1` 또는 `0` |
| `POST /expire` | `{ key, ttl }` | `"OK"`, 없는 키면 `null` |
| `GET /health` | 없음 | `{ "status": "ok" }` |

- 성공: `200 { "result": ... }`
- 실패: 상태 코드 + `{ "error": "..." }`

<br>

| 상태 코드 | 상황 |
| --- | --- |
| 400 | JSON이 아님, 모르는 필드, 필수 필드 없음, 타입이 틀림 |
| 404 | 없는 주소 |
| 405 | 허용하지 않는 메서드 |
| 413 | body가 1MB 초과 |
| 500 | 서버 내부 예외 |

<br>

**입력 규칙**

- `key`: 빈 문자열 불가
- `value`: 문자열 (빈 문자열 허용). 객체는 `JSON.stringify`로 바꿔서 넣습니다.
- `ttl`: 1 이상의 정수, 단위는 ms
- `nx`: `true`면 키가 없을 때만 저장
- SET은 기존 값을 덮어쓰고, 기존 TTL도 지웁니다.

<br>

### 간단한 사용 방법

`src/client/client.ts`의 `createClient`로 바로 호출할 수 있습니다. 에러 응답(4xx/5xx)은 예외로 던집니다.

```ts
import { createClient } from "./src/client/client.ts"; // 저장소 루트 기준 경로

const client = createClient("http://127.0.0.1:3000");

await client.set("token:abc", "user-1");                // "OK"
await client.get("token:abc");                         // "user-1"

await client.set("token:abc", "user-2", { nx: true });  // null (이미 있어서 거절)
await client.get("token:abc");                         // "user-1" (그대로)

await client.set("session:1", "data", { ttl: 60_000 }); // "OK", 60초 뒤 만료
await client.expire("token:abc", 5_000);                // "OK", 5초 뒤 만료
await client.expire("nope", 5_000);                     // null (없는 키)

await client.del("token:abc");                          // 1
await client.get("token:abc");                          // null

await client.get("");          // 예외: mini-redis 400: invalid field: key
```

<br>

## 2. 사용 방법 (데모)

### 토큰 확인에 캐시 붙이기

API 요청마다 토큰으로 사용자를 찾는 상황입니다. 캐시에 있으면 캐시에서, 없으면 DB에서 읽고 캐시에 60초 동안 저장합니다(cache-aside).

```ts
import { createClient } from "./src/client/client.ts";

const client = createClient("http://127.0.0.1:3000");

// 가짜 DB: 조회에 100ms가 걸린다고 가정
async function findUserByTokenFromDb(token: string) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return JSON.stringify({ userId: 1, token });
}

async function checkToken(token: string) {
    const cached = await client.get(`token:${token}`);
    if (cached !== null) return { from: "cache", user: JSON.parse(cached) };

    const user = await findUserByTokenFromDb(token);
    await client.set(`token:${token}`, user, { ttl: 60_000 });
    return { from: "db", user: JSON.parse(user) };
}

for (let i = 0; i < 3; i++) {
    console.time("checkToken");
    console.log(await checkToken("abc"));
    console.timeEnd("checkToken");
}
```

### 결과 (가짜 DB 기준)

| 회차 | 어디서 읽었나 | 걸린 시간 |
| --- | --- | --- |
| 1 | DB | 약 128ms |
| 2 | 캐시 | 약 6ms |
| 3 | 캐시 | 약 6ms |

- DB는 실제 DB가 아니라 `setTimeout`으로 100ms 지연을 흉내 낸 가짜 DB입니다. 실제 DB와의 비교가 아닙니다.
- 측정값은 `examples/try-cache.sylee.ts`를 실행한 결과입니다. 이 파일은 클라이언트 라이브러리 대신 `fetch` 래퍼로 같은 HTTP 요청을 보내고, 측정 구간에 NX 실험용 요청 2번이 함께 들어 있습니다.
- 두 번째부터는 DB를 거치지 않으므로, 캐시가 DB 조회를 대신하는 효과를 확인할 수 있습니다.

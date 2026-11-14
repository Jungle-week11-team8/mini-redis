# 유저 시나리오

[← README로 돌아가기](../README.md)

## 유저 스토리: 캐싱

- **누가**: 백엔드 개발자, 운영자
- **무엇을**: 자주 조회하는 데이터를 매번 DB에서 가져오지 않기를 원한다.
- **왜**: 모든 API 요청마다 토큰을 확인해야 해서 DB 조회가 반복된다. 요청이 몰리면 DB가 그 조회만으로 바빠져서 정작 중요한 쿼리가 밀린다.

**완료 조건**

- [x] 자주 조회하는 데이터를 저장, 조회, 삭제할 수 있다.
- [x] DB에서 조회하는 것보다 빠르게 조회할 수 있다. ([매뉴얼의 데모](manual.md#2-사용-방법-데모), 가짜 DB 기준)
- [x] TTL(키 만료) 기능이 있다.
- [x] 저장할 때 동시성 문제가 생기지 않는다.

<br>

**설계 전에 고민한 질문**

| 질문 | 결론 |
| --- | --- |
| DB 데이터와 캐시 데이터가 달라지면? | TTL을 지원해서 오래된 값이 남는 시간을 제한한다. |
| 같은 키가 이미 있으면 덮어쓸까? | 기본은 덮어쓰기. 없을 때만 저장하는 NX 옵션도 지원한다. |
| 같은 키에 동시에 저장하면? | 들어온 순서대로 처리한다. 그래서 싱글 스레드로 간다. |

---

<br>

## 1. 처음에 개발한 방식

<br>

결정마다 고른 것과 이유를 한 줄씩 적었습니다.

| 결정 | 고른 것 | 이유 |
| --- | --- | --- |
| 계층 | server → protocol → commands → store | 계층마다 책임을 한 문장으로 설명할 수 있게 나눴다. |
| 동시성 | 싱글 스레드 + 명령 경로에 `await` 금지 | 메모리 Map에는 기다릴 I/O가 없어서 `await`로 얻는 게 없고, 락 없이 명령 단위 원자성을 얻는다. |
| 책임 분리 | 만료는 store, NX 같은 옵션은 commands | store가 다 맡으면 책임이 너무 커지고, commands가 다 맡으면 만료 확인을 한 곳만 빠뜨려도 만료된 값이 노출된다. |
| Store 형태 | 팩토리 함수 `createStore()` | 기존 `createMiniRedisServer()`와 같은 패턴이고, 반환 타입이 `Store`로 고정된다. |
| 값의 자료구조 | 문자열만 | 범위를 줄이려고 String부터 시작했다. |
| TTL 저장 | 남은 시간이 아니라 만료 시각 | 만료 시각은 변하지 않아서 조회할 때 한 번만 비교하면 된다. |
| 만료 키 정리 | lazy만 (접근할 때 판단) | JS의 Map에는 무작위로 키를 꺼내는 기능이 없어 active 방식이 어렵고, 키별 `setTimeout`은 타이머 관리 부담이 크다. |
| 만료 경계 | `now >= expiresAt`면 만료 | 토큰 캐시라서 만료된 토큰을 1ms라도 통과시키지 않는 보수적인 쪽을 골랐다. |
| SET + TTL | `set` 후 `setExpiry` 두 번 호출 | EXPIRE와 같은 함수를 재사용한다. 두 호출 사이에 `await`가 없어서 한 번에 일어난 것과 같다. |
| HTTP 형식 | 명령별 주소 + 이름 붙은 JSON | 사용자인 백엔드 개발자가 칸 순서를 외우지 않아도 되고, `/set` ↔ `commands/set.ts`가 1:1로 대응한다. |
| 입력 검증 | protocol 한 곳 | JSON 구조체로 받기로 하면서 검증을 protocol로 옮겼다. commands는 에러를 만들지 않는다. |
| DEL | 키 하나만 | 여러 키 삭제는 범위 밖으로 두었다. |

<br>

처음에는 이 서버를 쓰는 쪽에서 `fetch` 래퍼를 직접 만들어 썼습니다.

```ts
const CACHE = "http://127.0.0.1:3000";

async function cache(command: string, body: object) {
    const response = await fetch(`${CACHE}/${command}`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    return (await response.json()).result;
}

const cached = await cache("get", { key: `token:${token}` });
```

---

<br>

## 2. 쓰면서 겪은 한계점

직접 써 보면서 찾은 사용성 문제입니다.

1. **클라이언트 라이브러리가 없다.**
   쓰는 사람마다 `fetch`와 `cache()` 래퍼를 직접 짜야 했습니다. 에러 응답(4xx)을 처리해야 한다는 것도 사용자는 모를 가능성이 높습니다.
2. **값을 문자열로만 받는다.**
   객체를 넣을 때마다 `JSON.stringify`와 `JSON.parse`를 직접 해야 합니다. 범위를 줄이려고 의도한 결정이었고, 시간 관계상 다른 자료구조 지원은 하지 않았습니다.
3. **`null`이 여러 뜻을 가진다.**
   응답 형식을 통일하려고 대부분 `null`로 돌려주도록 했는데, 오히려 응답만 보고 무슨 일이 있었는지 알기 어려워졌습니다.

   | 상황 | 우리 | Redis |
   | --- | --- | --- |
   | GET, 없는 키 | `null` | nil |
   | SET NX, 거절됨 | `null` | nil |
   | EXPIRE, 없는 키 | `null` | 정수 `0` |
   | EXPIRE, 성공 | `"OK"` | 정수 `1` |
   | DEL | 지운 개수 | 지운 개수 (같음) |

   - 개선 방안: `set`과 `expire`가 `true`/`false`를 돌려주게 바꾸고, `null`은 GET의 "값 없음"에만 남깁니다. 아직 반영하지 않았습니다.


---

<br>

## 3. 개선 사항: 클라이언트 라이브러리 제공

사용자가 매번 래퍼를 직접 감싸면 중복 코드가 늘고, 에러 처리 책임까지 사용자에게 넘기는 셈이었습니다. 그래서 `src/client/client.ts`에 클라이언트 라이브러리를 추가했습니다.

```ts
// 사용자가 쓰는 코드 (src/client/client.ts의 createClient)
const client = createClient("http://127.0.0.1:3000");

const cached = await client.get(`token:${token}`);
await client.set(`token:${token}`, user, { ttl: 60_000 });
```

- `set`, `get`, `del`, `expire`를 함수로 바로 부를 수 있습니다.
- 에러 응답(4xx/5xx)은 예외로 던집니다. 예: `mini-redis 400: invalid field: key`
- 서버 코드는 import하지 않고 `src/types.ts`의 타입만 씁니다. 서버 밖에서 쓰는 라이브러리이기 때문입니다.

<br>

### 개선범위에서 제외한 한계 
- [think-list.md](../think-list.md) 파일 참고

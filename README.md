# mini-redis

자주 조회하는 데이터(예: 매 요청마다 확인하는 토큰)를 DB 대신 메모리에 캐싱하는 HTTP 서버.
Krafton Jungle week11 & 12 LLM 활용

## 왜
모든 API 요청이 토큰 확인을 위해 DB를 조회하면, 요청이 몰릴 때 정작 중요한 쿼리가 밀린다.

## 빠른 시작
cp .env.example .env
npm ci
npm run dev        # http://127.0.0.1:3000

## API
POST만 사용, 성공은 200 { "result": ... }, 실패는 상태 코드 + { "error": "..." }

| 주소        | body                         | result                        |
|-------------|------------------------------|-------------------------------|
| /set        | { key, value, nx?, ttl? }    | "OK", NX인데 키가 있으면 null |
| /get        | { key }                      | 값, 없거나 만료면 null        |
| /del        | { key }                      | 1 또는 0                      |
| /expire     | { key, ttl }                 | "OK", 없는 키면 null          |
| GET /health | -                            | { "status": "ok" }            |

- 값은 문자열, ttl은 ms(1 이상의 정수)
- 에러: 400 검증, 404 주소, 405 메서드, 413 body 1MB 초과

curl 예시 2~3줄

## 구조
(기존 트리 + 계층별 책임 한 줄씩)
server → protocol(라우팅·검증) → commands(NX 등 옵션) → store(저장·만료)

## 설계 결정
- 동시성: 싱글 스레드 + 명령 실행 경로에 await 없음 → 명령 단위 원자성
- 만료: lazy(접근할 때 판단), 만료 시각을 절대 시각으로 저장
- 검증은 protocol 한 곳에서, commands는 에러를 만들지 않음
- 실제 Redis와의 차이 → (비교표 링크 또는 접기)

## 한계
think-list.md 링크

## 개발 환경
(기존 fnm·셸 연결·typecheck·test·Redis 비교 환경 내용 유지)
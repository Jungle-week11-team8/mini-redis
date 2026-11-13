# Mini Redis

## 환경 규칙

- Node.js 24 LTS에서 `node src/index.ts`로 직접 실행합니다. 빌드 도구는 사용하지 않습니다.
- TypeScript는 타입 표기만 사용합니다. enum/namespace는 금지하고 상대 import에 `.ts`를 포함합니다.
- 타입 검사는 실행과 분리하여 커밋 전에 `npm run typecheck`로 수행합니다.
- Windows/macOS 공용으로 작성합니다. 경로는 `path.join`, npm 스크립트에는 셸 전용 문법이나 `.sh`를 사용하지 않습니다.
- 테스트는 `node --test`로 실행합니다.
- 새 의존성을 추가하기 전에 먼저 사용자에게 물어봅니다.
- 포맷은 Prettier 기본값을 따릅니다.

## 구조 규칙

- 계층 간 import는 server/ → protocol/ → commands/ → store/ 방향을 따릅니다.
- 계층 간 공통 타입은 `src/types.ts`에 정의합니다.
- 명령 하나는 commands/ 아래 파일 하나와 test/ 아래 테스트 하나로 구성합니다.
- 에러 응답 형식은 `src/types.ts`의 정의를 따릅니다.
- 명령 실행 경로(commands/, store/)는 동기로 작성하고 `await`를 쓰지 않습니다. 싱글 스레드에서 명령의 원자성은 이 규칙에 기댑니다.
- 비동기 작업(HTTP body 읽기 등)은 protocol/ 이상에서 명령 실행 전후에만 합니다.

## 확정 범위

- 통신은 HTTP, 지원할 명령은 SET/GET/DEL/EXPIRE입니다.
- 값은 문자열, TTL 단위는 ms입니다. nil은 HTTP 응답에서 JSON null로 표현합니다.
- 백엔드 API node.js + HTTP로 구현합니다.
- Store 인터페이스는 `src/types.ts`에 있고, 명령을 만들 때마다 메서드를 하나씩 추가합니다.
- 입력 검증은 protocol/에서 합니다. commands/는 검증된 명령별 구조체(`src/types.ts`)를 받아 Reply를 돌려주며 에러를 만들지 않습니다.
- HTTP는 명령별 주소 + 이름 붙은 JSON입니다. 예: `POST /set` + `{ "key": "token", "value": "abc", "nx": true, "ttl": 1000 }`
- server/는 body 읽기(1MB 초과 413)와 응답 쓰기만 하고, 라우팅·파싱·검증·Reply 변환은 protocol/의 동기 함수 `handle`이 합니다.
- 성공 응답은 200 `{ "result": ... }`(success → "OK", nil → null), 에러는 상태 코드 + `{ "error": "..." }`(400 검증, 404 주소, 405 메서드, 413 크기, 500 예외)입니다. 타입은 `src/types.ts`의 `HttpResponse`입니다.
- 검증 규칙: body는 JSON 객체, 모르는 필드·잘못된 타입은 400, key는 빈 문자열 불가, value는 빈 문자열 허용, ttl은 1 이상의 정수, SET의 nx/ttl은 생략 가능.
- 포트는 환경변수 `PORT`, 기본 3000입니다. `GET /health`만 POST가 아닌 예외입니다.

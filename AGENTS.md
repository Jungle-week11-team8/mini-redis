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
- 에러 응답 형식은 합의 후 `src/types.ts`에 정의하고 그 정의를 따릅니다.

## 확정 범위

- 통신은 HTTP, 지원할 명령은 SET/GET/DEL/EXPIRE입니다.
- 값은 문자열, TTL 단위는 ms입니다. nil은 HTTP 응답에서 JSON null로 표현합니다.
- 백엔드 API node.js + HTTP로 구현합니다.
- Command 객체, Store 인터페이스, 명령 엔드포인트, 오류 검증 계층, 실제 서버 포트는 미정입니다.

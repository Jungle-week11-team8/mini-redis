# mini-redis
Krafton Jungle week11 &amp; 12 LLM 활용

## 개발 환경

```text
mini-redis/
├─ src/
│  ├─ server/    # 받기: HTTP 네트워크
│  ├─ protocol/  # 해석하기: 요청 → 명령 객체
│  ├─ commands/  # 실행하기: SET, GET, DEL, EXPIRE
│  ├─ store/     # 저장하기: 해시 테이블, TTL
│  ├─ types.ts   # 확정된 계층 공통 타입
│  └─ index.ts   # 서버 시작점
└─ test/
```

1. Node.js 24 LTS와 fnm을 사용합니다. Windows는 `winget install Schniz.fnm`, macOS는 `brew install fnm`으로 설치합니다.
2. 셸에 fnm을 연결한 뒤 프로젝트에서 `fnm install` → `fnm use` → `npm ci`를 실행합니다.
3. `.env.example`을 `.env`로 복사하고 `npm run dev`로 시작합니다. 임시 확인 주소는 `http://127.0.0.1:3000/health`입니다.
4. `npm run typecheck`는 별도 타입 검사, `npm test`는 내장 테스트 실행입니다. 실제 기능 테스트는 아직 없습니다.
5. 값은 문자열, TTL은 ms, nil은 JSON null입니다. 명령·저장소 구현과 미정 설계, 인계 문서 6번·7번은 이번 설정에 포함하지 않습니다.

## 셸 연결 (최초 1회)

Windows PowerShell에서 다음 명령으로 현재 터미널에 fnm을 연결합니다. 자동 적용하려면 PowerShell 프로필에 같은 내용을 추가합니다.

```powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
```

macOS는 `~/.zshrc`에 다음을 추가하고 새 터미널을 엽니다.

```zsh
eval "$(fnm env --use-on-cd --shell zsh)"
```

`.env` 복사: Po

## 실제 Redis 비교 환경

Docker Desktop을 실행한 상태에서 `npm run redis:compare`를 실행합니다. 실제 Redis는 로컬 포트 6380을 사용하며, 종료하면 비교 컨테이너가 삭제됩니다. 구현할 Mini Redis와 통신 방식은 다릅니다.

## 개발 확인용 범위

`/health`와 포트 3000은 환경 확인용입니다. 명령 엔드포인트는 `POST http://127.0.0.1:3000/mini-redis`. SET은 덮어쓰기 시 기존 TTL을 제거하며, NX는 키가 있으면 nil, GET은 없음·만료 시 nil, DEL은 삭제 개수, EXPIRE는 TTL(ms) 변경 및 키 없음 시 nil을 반환하도록 구현할 예정입니다.werShell은 `Copy-Item .env.example .env`, macOS는 `cp .env.example .env`를 사용합니다.
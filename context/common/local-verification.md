# Local Verification

이 저장소의 로컬 검증은 구조 검증만 수행한다.

```bash
npm run verify
```

## Scope

- 필수 파일 존재 여부
- 사용하는 서비스의 context 링크 존재 여부
- service context 필수 섹션 존재 여부
- AGENTS.md 내부 링크 존재 여부
- rules 문서의 `RULE-*` id 중복 여부

## Non Goals

- 서비스 구현의 correctness를 판단하지 않는다.
- schema, Zod, SQL, Go struct의 의미적 일치 여부를 판정하지 않는다.
- AI 평가 결과를 파일로 남기지 않는다.

## Service Verification

각 서비스별 검증 명령은 해당 서비스 README 또는 CONTRIBUTING을 기준으로 한다. 이 저장소는
서비스 verify 명령을 실행하지 않고, 위치와 규칙을 안내한다.


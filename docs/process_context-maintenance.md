# Context Maintenance Process

이 문서는 context와 rules를 유지보수할 때 따르는 절차를 설명한다.

## Baseline

기본 구현 기준은 `registry/services.md`에 있는 GitHub repository의 `origin/main`이다.
local path는 registry에 기록하지 않는다.

## Remote Main Evaluation

local path가 명시되지 않은 평가는 GitHub org에서 관리하는 repository의 원격 `main`을 기준으로
한다.

1. `registry/services.md`의 "사용하는 것"을 확인한다.
2. 필요한 repository의 원격 `main`에서 README, CONTRIBUTING, 주요 domain code, workflow를 확인한다.
3. `context/services`, `context/workflows`, `rules`의 설명과 실제 구현/문서의 책임이 맞는지 비교한다.
4. endpoint, env, public domain, data source, SDK/API responsibility 문구가 오래되었거나 반대로 쓰였는지 확인한다.
5. 구조 검증으로 `npm run verify`를 실행하되, 구조 통과를 내용 일치로 간주하지 않는다.

네트워크나 인증 문제로 원격 `main`을 확인할 수 없으면 추정하지 않고 한계를 리포트한다.

이 평가는 `skills/loopad-ctx-contract-sync-checker/SKILL.md`를 기준으로 수행한다.

## Local Comparison

사용자가 local path를 명시한 경우에만 로컬 작업물을 비교한다.

1. local path가 Git repository인지 확인한다.
2. 현재 branch를 개발 중 변경 기준으로 본다.
3. `git fetch origin`으로 `origin/main`을 최신화한다.
4. local current branch와 `origin/main`의 차이를 확인한다.
5. context/rules 영향이 있는 변경만 대화 리포트로 설명한다.

`git fetch origin`이 실패하면 비교 판단을 중단하고 한계를 리포트한다.

## Output

평가 결과는 기본적으로 대화 리포트로만 제공한다. 사용자가 명시적으로 요청하지 않으면
문서 파일, findings 파일, 자동 수정 패치를 만들지 않는다.

## Verification

```bash
npm run verify
```

구조 검증은 `skills/loopad-ctx-structure-verifier/SKILL.md`를 기준으로 수행한다. 구조 검증은
내용 동기화 검사를 대체하지 않는다.

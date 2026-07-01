# AGENTS.md

이 저장소는 LoopAd 프로젝트를 이해하기 위한 AI context 저장소다. 실제 구현은
[registry/services.md](registry/services.md)의 "사용하는 것"에 있는 GitHub repository를
기준으로 본다.

이 저장소는 개별 service repository의 README/CONTRIBUTING을 대체하지 않는다.
대신 프로젝트 간 관계, 공통 계약, cross-repo workflow, 그리고 모든 서비스가 지켜야
하지만 특정 한 repository 내부에만 소속되기 어려운 규칙을 모아 설명한다. 따라서
context/rules의 cross-repo 규칙이 개별 service repository의 CI, README,
CONTRIBUTING에 동일하게 중복되거나 자동 강제되지 않았다는 사실만으로는 불일치로
판정하지 않는다. 구현, 공개 계약, 책임 경계가 context 설명과 실제로 충돌할 때만
동기화 문제로 본다.

## 읽는 순서

1. [registry/services.md](registry/services.md)
2. [registry/code-map.md](registry/code-map.md)
3. [context/common/domain-model.md](context/common/domain-model.md)
4. [context/common/project-principles.md](context/common/project-principles.md)
5. 필요한 [context/services](context/services) 문서
6. 관련 [context/workflows](context/workflows) 문서
7. 관련 [rules](rules) 문서
8. 구조 검증이 필요하면 [.agents/skills/loopad-ctx-structure-verifier/SKILL.md](.agents/skills/loopad-ctx-structure-verifier/SKILL.md)
9. 원격 main 또는 명시된 local path와 context/rules 동기화 검사가 필요하면 [.agents/skills/loopad-ctx-contract-sync-checker/SKILL.md](.agents/skills/loopad-ctx-contract-sync-checker/SKILL.md)

## Source Baseline

기본 구현 기준은 [registry/services.md](registry/services.md)에 있는 GitHub repository의
`origin/main`이다. 로컬 checkout을 임의로 탐색하거나 추정하지 않는다.

사용자가 local path를 명시하면, 그 path의 현재 branch를 개발 중 변경 기준으로 본다.
이 경우 비교 기준은 같은 repository의 `origin/main`이며, local path의 현재 branch와
`origin/main`의 차이를 context/rules 영향 범위로 평가한다.

local path 비교를 할 때는 먼저 `git fetch origin`으로 `origin/main`을 최신화한다.
fetch가 실패하면 비교 판단을 중단하고 대화 리포트에서 한계를 설명한다.

## 제외 규칙

[registry/services.md](registry/services.md)의 "사용하지 않는 것"에 포함된 repository는
기본 탐색 대상에서 제외한다. generated output, 발표 산출물, archived repo, 과거 과제용
repo는 코드/계약 판단의 근거로 삼지 않는다.

## Local Skill Rule

이 저장소의 검증 skill은 이 저장소 안의 local skill만 기준으로 한다.
구조 검증은 [.agents/skills/loopad-ctx-structure-verifier/SKILL.md](.agents/skills/loopad-ctx-structure-verifier/SKILL.md)를,
원격 main 또는 명시된 local path와 context/rules 동기화 검사는
[.agents/skills/loopad-ctx-contract-sync-checker/SKILL.md](.agents/skills/loopad-ctx-contract-sync-checker/SKILL.md)를 사용한다.
외부/개인 Codex skill에 의존하지 않는다.

평가 결과는 기본적으로 대화 리포트로만 출력한다. 사용자가 명시적으로 요청하지 않으면
파일을 생성하거나 수정하지 않는다.

## Repository Operating Rules

이 저장소의 폴더 구조와 작업 규칙은
[docs/reference_repository-structure.md](docs/reference_repository-structure.md)와
[docs/process_context-maintenance.md](docs/process_context-maintenance.md)를 따른다.

새 service context는 [docs/template_service-context.md](docs/template_service-context.md)를
기준으로 작성한다. 새 workflow context는
[docs/template_workflow-context.md](docs/template_workflow-context.md)를 기준으로 작성한다.
새 rules 문서는 [docs/template_rule-pack.md](docs/template_rule-pack.md)를 기준으로 작성한다.

# LoopAd Context

이 저장소는 LoopAd 프로젝트의 코드 저장소가 아닙니다. 팀 공통으로 사용하는 서비스,
워크플로, 도메인 용어, 느슨한 규칙 문구, AI 평가용 로컬 skill, 그리고 얕은 구조
검증을 관리하는 context 저장소입니다.

사람은 이 README에서 시작합니다. AI agent는 [AGENTS.md](AGENTS.md)를 먼저 읽습니다.

## 저장소 역할

- 현재 사용하는 LoopAd 서비스와 사용하지 않는 저장소를 정리합니다.
- 서비스별 context와 여러 서비스가 엮이는 workflow context를 분리해서 관리합니다.
- 공통 용어, 도메인 모델, 프로젝트 원칙을 한 곳에 둡니다.
- 문장 기반 규칙 묶음을 관리하되 엄격한 schema contract로 다루지 않습니다.
- 로컬 구조 검증은 `npm run verify`로 실행합니다.
- 원격 `main` 또는 명시된 local path와의 내용 동기화 검사는
  `.agents/skills/loopad-ctx-contract-sync-checker/SKILL.md`를 기준으로 수행합니다.

## 기본 사용

```bash
npm run verify
```

`verify`는 문서 내용의 옳고 그름을 판단하지 않습니다. 필수 파일, 필수 섹션,
context 링크, rule id 중복처럼 구조적으로 확실히 확인 가능한 것만 검사합니다.

## 유지보수 문서

- [Repository Structure](docs/reference_repository-structure.md)
- [Context Maintenance Process](docs/process_context-maintenance.md)
- [Service Context Authoring Guide](docs/guide_service-context-authoring.md)
- [Workflow Context Authoring Guide](docs/guide_workflow-context-authoring.md)

# Documentation Rules

LoopAd context 문서는 목적별로 위치를 나눈다.

## Document Roles

- `README.md`: 사람용 소개와 기본 사용법.
- `AGENTS.md`: AI agent가 먼저 읽는 진입점.
- `registry/*`: 사용하는 것, 사용하지 않는 것, 구현 위치.
- `context/common/*`: 프로젝트 공통 세계관과 용어.
- `context/services/*`: 단일 서비스 context.
- `context/workflows/*`: 여러 서비스가 엮이는 workflow context.
- `rules/*`: 느슨한 문구 기반 규칙 묶음.
- `skills/*`: 이 저장소 내부에서만 쓰는 local evaluator skill.
- `docs/*`: 이 저장소의 구조, 작성법, 유지보수 절차, 템플릿.

## Maintenance Rule

문서를 섞지 않는다. 서비스 단독 설명은 service context로, 통합 흐름은 workflow context로,
공통 용어와 원칙은 common 문서로 옮긴다.


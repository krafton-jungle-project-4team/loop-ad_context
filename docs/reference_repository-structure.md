# Repository Structure Reference

이 문서는 `loop-ad_context` 저장소의 폴더별 책임을 정의한다.

## Top Level

- `README.md`: 사람용 소개와 실행 방법.
- `AGENTS.md`: AI agent용 진입점과 평가 기준.
- `package.json`: 로컬 구조 검증 명령.

## Directories

- `registry/`: 사용하는 repository, 사용하지 않는 repository, code map.
- `context/common/`: 공통 용어, 도메인 모델, 프로젝트 원칙.
- `context/services/`: 단일 service context.
- `context/workflows/`: 여러 service가 엮이는 workflow context.
- `rules/`: 느슨한 문구 기반 rule pack.
- `.agents/skills/`: 이 저장소 안에서만 쓰는 repo-scoped local skills. 구조 검증과 계약/문구 동기화 검사는 별도 skill로 분리한다.
- `checks/`: zero-dependency 구조 검증 스크립트.
- `docs/`: 이 저장소 자체의 구조, 절차, guide, template.

## Rule

새 문서를 추가할 때는 기존 디렉터리 책임에 맞는 위치를 먼저 찾는다. 목적이 섞이면
문서를 나눈다.

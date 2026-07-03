# Env And Deployment Rules

이 문서는 환경변수, secret, dev 배포 흐름에 관한 느슨한 문구 묶음이다. 각 repository의
workflow YAML이나 secret inventory를 대체하지 않는다.

## RULE-ENV-001

Public API domain, frontend domain, deployment role, environment variable contract는 infra와
service README의 합의된 설명을 따른다.

## RULE-ENV-002

운영 secret, 실제 password, token, API key는 context 문서에 기록하지 않는다.

## RULE-ENV-003

local env example은 개발 편의를 위한 값이며 production secret이나 dev secret의 근거가
아니다.

## RULE-ENV-004

LoopAd의 통합 환경 테스트는 현재 배포된 dev 서버 환경과 dev data source를 기준으로 수행한다.

## RULE-ENV-005

deployable service와 frontend는 각 repository의 `main` branch 변경을 dev 환경 CI/CD 기준으로
삼는다.

## RULE-ENV-006

server와 frontend app repository는 infra repo의 reusable deployment workflow와 runtime
env/secret contract를 따른다.

## RULE-ENV-007

서버는 필수 env에 fallback/default를 두지 않고 시작 시 검증한다. 필수 env가 없으면 즉시
실패해야 한다.

## RULE-ENV-008

서버는 `PORT` env를 읽어 `0.0.0.0:${PORT}`로 listen하고, 정상 상태일 때 `/health`에서 HTTP
200을 반환한다.

## RULE-ENV-009

`/internal/*` 요청은 내부 API key header를 검증한다. 내부용 route를 public route처럼 열어
두지 않는다.

## RULE-ENV-010

앱 코드는 Secrets Manager나 SSM Parameter Store를 직접 조회하는 책임을 갖지 않는다. secret
주입과 권한은 infra/runtime 계약에서 다룬다.

## RULE-ENV-011

호텔 도메인 이관 중에도 기존 `.github` 디렉터리, deploy workflow, 기존 env 이름은 유지한다.
필요한 신규 env는 추가하되 기존 public contract 이름을 조용히 rename하지 않는다.

## RULE-ENV-012

GenAI asset prefix env는 repository별 기존 이름을 우선 유지한다. 호환이 필요하면
compatibility layer에서 두 이름을 모두 읽되, repo 내부 public contract를 함부로 바꾸지
않는다.

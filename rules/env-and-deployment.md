# Env And Deployment Rules

## RULE-ENV-001

Public API domain, deployment role, environment variable contract는 infra와 service README의 합의된 설명을 따른다.

## RULE-ENV-002

운영 secret이나 실제 password는 context 문서에 기록하지 않는다.

## RULE-ENV-003

local env example은 개발 편의를 위한 값이며 production secret의 근거가 아니다.

## RULE-ENV-004

LoopAd의 통합 환경 테스트는 현재 배포된 dev 서버 환경과 dev data source를 기준으로 수행한다.

## RULE-ENV-005

deployable service와 frontend는 각 repository의 `main` branch 변경을 dev 환경 CI/CD 기준으로 삼는다.

## RULE-ENV-006

server와 frontend app repository는 infra repo의 reusable deployment workflow와 runtime env/secret contract를 따른다.

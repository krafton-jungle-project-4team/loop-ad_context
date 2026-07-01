# Deployment Workflow

## 목적

LoopAd 서비스의 배포와 public domain/env contract를 일관되게 관리한다.

## 참여 서비스

- `loop-ad_infra`
- `loop-ad_event_sdk`
- `loop-ad_advertisement_sdk`
- `loop-ad_event_collector`
- `loop-ad_dashboard`
- `loop-ad_demo-shoppingmall_front`
- `loop-ad_decision`

## 흐름

1. Infra repo가 dev AWS resource, public domain, deploy target, runtime env/secret contract를
   관리한다.
2. 통합 환경 테스트는 각 서비스를 로컬로 임의 조합한 상태가 아니라 현재 배포된 dev 서버
   환경을 기준으로 수행한다.
3. 서버 repo는 `main` branch push를 기준으로 Docker image를 빌드하고 infra reusable
   `ecs-deploy.yml`을 호출해 dev ECS/Fargate service에 배포한다.
4. Dashboard web과 demo shoppingmall web은 `main` branch push를 기준으로 정적 산출물을
   만들고 infra reusable `frontend-deploy.yml`을 호출해 S3/CloudFront dev site에 배포한다.
5. SDK repos는 package/bundle publish contract를 따른다. browser SDK 번들은 demo/front
   integration에서 사용하는 public artifact다.
6. runtime env와 secret은 app repo workflow가 임의로 소유하지 않고 infra contract,
   GitHub environment, AWS secret injection을 따른다.
7. dev 배포 후 통합 검증은 public dev domains와 dev data sources를 통해 확인한다.

## Dev 배포 대상

- Server: `event-collector`, `dashboard-api`, `decision-api`.
- API domain: `event.api.dev.loop-ad.org`, `dashboard.api.dev.loop-ad.org`,
  `decision.api.dev.loop-ad.org`.
- Frontend domain: `dashboard.dev.loop-ad.org`, `demo-shoppingmall.dev.loop-ad.org`.
- Data source: Aurora PostgreSQL, ClickHouse, Kafka, DataStorage S3.

## 관련 rule

- `RULE-ENV-001`
- `RULE-ENV-002`
- `RULE-ENV-003`
- `RULE-ENV-004`
- `RULE-ENV-005`
- `RULE-ENV-006`

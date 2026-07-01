# Infra Context

## 역할

`loop-ad_infra`는 LoopAd 서비스의 인프라, 배포, public domain, 환경 설정 계약을 관리하는
repository다.

## 하지 않는 일

- 각 application service의 domain logic을 소유하지 않는다.
- service README에 있어야 하는 public usage guide를 대체하지 않는다.

## 공개 인터페이스

- AWS infrastructure definitions.
- Public API domain contract.
- Deployment role and environment variable contract.
- Reusable deployment workflows.

## Dev 배포 계약

- 현재 통합 테스트와 사용자 흐름 검증은 dev 서버 환경을 기준으로 한다.
- Infra repo는 dev용 network, data source, runtime, frontend static site, public domain,
  app repository deploy target을 소유한다.
- 서버 repo는 Docker image로 빌드되어 ECS/Fargate service에서 실행된다.
- 서버 deploy workflow는 infra repo의 reusable `ecs-deploy.yml`을 호출한다.
- frontend repo는 정적 파일을 빌드해 S3/CloudFront로 배포하고 infra repo의 reusable
  `frontend-deploy.yml`을 호출한다.
- 각 app repo의 deploy workflow는 `main` branch push를 dev 배포 기준으로 삼는다.
- runtime env와 secret은 app workflow가 직접 정의하지 않고 infra contract와 AWS runtime
  secret injection을 따른다.

## Dev 배포 대상

- ECS/Fargate: `event-collector`, `dashboard-api`, `decision-api`.
- Public API domains: `https://event.api.dev.loop-ad.org`,
  `https://dashboard.api.dev.loop-ad.org`, `https://decision.api.dev.loop-ad.org`.
- Frontend domains: `https://dashboard.dev.loop-ad.org`,
  `https://demo-shoppingmall.dev.loop-ad.org`.
- Data resources: Aurora PostgreSQL, ClickHouse EC2, Kafka EC2, DataStorage S3.

## 의존 서비스

- 모든 deployable service가 infra contract를 참조한다.

## 관련 workflow

- [../workflows/deployment.md](../workflows/deployment.md)
- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-ENV-001`
- `RULE-ENV-002`
- `RULE-ENV-004`
- `RULE-ENV-005`
- `RULE-ENV-006`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

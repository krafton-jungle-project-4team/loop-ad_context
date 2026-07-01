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

## 의존 서비스

- 모든 deployable service가 infra contract를 참조한다.

## 관련 workflow

- [../workflows/deployment.md](../workflows/deployment.md)
- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-ENV-001`
- `RULE-ENV-002`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

## TODO

- 실제 stack/resource ownership과 public domain naming rule을 `origin/main` 기준으로 보강한다.


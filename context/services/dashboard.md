# Dashboard Context

## 역할

`loop-ad_dashboard`는 Dashboard web client, Dashboard API server, Ads serve API를 포함하는
서비스 repository다.

## 하지 않는 일

- Dashboard/Ads request path에서 AI Decision을 직접 호출하지 않는다.
- 외부 DB/API 실패를 mock success로 숨기지 않는다.

## 공개 인터페이스

- Dashboard API endpoints.
- Ads serve API endpoints.
- Web client routes.
- Shared API/dashboard/ads types.

## 의존 서비스

- 읽기: PostgreSQL contract DB, ClickHouse event store.
- 사용처: `loop-ad_demo-shoppingmall_front`, `loop-ad_advertisement_sdk`.

## 관련 workflow

- [../workflows/dashboard-read.md](../workflows/dashboard-read.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-DASHBOARD-001`
- `RULE-AD-001`
- `RULE-SERVICE-003`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

## TODO

- API route list, env contract, shared package boundary를 `origin/main` 기준으로 보강한다.


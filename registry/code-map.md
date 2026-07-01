# Code Map

이 문서는 LoopAd 도메인별 구현 위치를 찾기 위한 안내다. 기본 구현 기준은 각 GitHub
repository의 `origin/main`이다. local path는 사용자가 명시한 경우에만 비교 대상으로 본다.

## Event Collection Domain

- Browser event runtime: `loop-ad_event_sdk/src/index.ts`
- Collector HTTP server: `loop-ad_event_collector/cmd/collector`
- Collector event validation: `loop-ad_event_collector/internal/event`
- Raw event storage contract: `loop-ad_data-source_contract/clickhouse/schema.sql`

## Advertisement Serving Domain

- Advertisement SDK runtime: `loop-ad_advertisement_sdk`
- Ads serve API: `loop-ad_dashboard/apps/api-server/src/features/ads`
- Ads shared API shape: `loop-ad_dashboard/packages/shared/src/ads`
- Demo placement integration: `loop-ad_demo-shoppingmall_front/src/components/ads`

## AI Decision Domain

- AI analysis and recommendation jobs: `loop-ad_decision`
- Contract DB write target: `loop-ad_data-source_contract/postgres/schema.sql`
- Dashboard read target: `loop-ad_dashboard/apps/api-server/src/features/dashboard`

## Dashboard Read Domain

- Dashboard web client: `loop-ad_dashboard/apps/web-client`
- Dashboard API server: `loop-ad_dashboard/apps/api-server`
- Shared dashboard response model: `loop-ad_dashboard/packages/shared/src/dashboard`
- ClickHouse event query layer: `loop-ad_dashboard/apps/api-server/src/features/dashboard/repository`

## Infrastructure And Deployment Domain

- Infrastructure definitions and service deployment contracts: `loop-ad_infra`
- Service-level deployment workflows: each service repository `.github/workflows`
- Public domain and environment naming rules: `loop-ad_infra` plus service README files


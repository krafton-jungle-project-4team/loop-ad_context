# Event SDK Context

## 역할

`loop-ad_event_sdk`는 브라우저에서 사용자 행동 이벤트를 수집해 Event Collector public
endpoint로 전송하는 SDK다.

## 하지 않는 일

- Kafka, ClickHouse, PostgreSQL, AWS secret에 직접 접근하지 않는다.
- identity가 없는 이벤트를 나중에 재전송하기 위해 보관하지 않는다.

## 공개 인터페이스

- npm package와 browser IIFE bundle.
- SDK client: `init`, `track`, `setIdentity`, `clearIdentity`, `destroy`.
- Event Collector ingest endpoint로 보내는 JSON payload.

## 의존 서비스

- 쓰기: `loop-ad_event_collector`
- 사용처: `loop-ad_demo-shoppingmall_front`

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-EVENT-001`
- `RULE-EVENT-002`
- `RULE-SERVICE-001`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

## TODO

- `origin/main` 기준 payload 필드와 SDK option 설명을 보강한다.


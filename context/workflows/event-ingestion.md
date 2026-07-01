# Event Ingestion Workflow

## 목적

브라우저 사용자 행동 이벤트를 SDK에서 수집해 Collector, Kafka, ClickHouse까지 전달한다.

## 참여 서비스

- `loop-ad_event_sdk`
- `loop-ad_event_collector`
- `loop-ad_data-source_contract`
- `loop-ad_infra`
- `loop-ad_demo-shoppingmall_front`

## 흐름

1. Demo front 또는 고객사 페이지가 Event SDK를 초기화한다.
2. Event SDK가 identity가 있는 이벤트만 payload로 만든다.
3. Event SDK가 Event Collector public endpoint로 JSON을 전송한다.
4. Event Collector가 payload를 검증한다.
5. Event Collector가 Kafka raw topic으로 원문 JSON을 발행한다.
6. ClickHouse ingestion pipeline이 raw event를 분석 가능한 events table로 저장한다.

## 관련 rule

- `RULE-EVENT-001`
- `RULE-EVENT-002`
- `RULE-EVENT-003`

## TODO

- Kafka topic, ClickHouse materialized view, event field mapping을 `origin/main` 기준으로 보강한다.


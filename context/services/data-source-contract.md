# Data Source Contract Context

## 역할

`loop-ad_data-source_contract`는 LoopAd 서비스들이 공유하는 PostgreSQL/ClickHouse 데이터
소스 계약과 로컬 실행 설정을 관리한다.

## 하지 않는 일

- 운영 migration history 전체를 관리하지 않는다.
- 서비스별 application logic을 담지 않는다.

## 공개 인터페이스

- PostgreSQL schema contract.
- ClickHouse schema contract.
- 로컬 Docker Compose와 local env example.

## ClickHouse event 계약

- event payload field의 기준은 이 repo의 ClickHouse event schema다. Event SDK payload와
  Event Collector validation은 이 계약을 따라야 한다.
- ClickHouse database 이름은 `loopad`다.
- 영구 저장 테이블은 `events`이며 `MergeTree`와
  `ORDER BY (project_id, event_time, event_name)`을 사용한다.
- `events.event_time`은 `DateTime64(3, 'UTC')`다.
- `events_raw_kafka`는 저장 테이블이 아니라 Kafka engine source table이다.
- `events_raw_kafka`는 SDK/Collector flat JSON field를 `JSONEachRow`로 읽는다.
- `events_raw_kafka_to_events` materialized view가 `event_time`을
  `parseDateTime64BestEffort(..., 'UTC')`로 변환해 `events`에 적재한다.
- `ingested_at`은 ClickHouse 적재 시점의 `now64(3, 'UTC')` 기본값이다.

## Kafka named collection 계약

- ClickHouse Kafka source는 `loopad_events_kafka` named collection을 사용한다.
- topic은 `loop-ad.events.raw`다.
- consumer group은 `loopad-clickhouse-events`다.
- format은 `JSONEachRow`다.
- security protocol은 `sasl_plaintext`, SASL mechanism은 `SCRAM-SHA-512`다.
- broker list와 app user credential은 배포 환경의 secret/env로 제공하며 context 문서에
  실제 secret 값을 기록하지 않는다.

## Raw event 보관 경계

- ClickHouse `events`가 raw event source다.
- PostgreSQL schema는 AI Decision 결과를 Dashboard/Ads serving에 공유하는 contract
  DB이며 raw ClickHouse event를 복사하지 않는다.
- 현재 데이터는 실제 고객 production data가 아니라 테스트 데이터와 공개 데이터셋 기반이다.
  따라서 contract/schema 변경 시 기존 더미 데이터 보존보다 DB, ClickHouse, Kafka topic을
  초기화하거나 더미 값으로 overwrite한 뒤 재적재/재생성하는 전략을 적극적으로 권장할 수 있다.
- event payload field 또는 ClickHouse schema 변경은 같은 변경 사이클 안에서 최소 Event
  SDK payload, Event Collector validation, Kafka 기존 raw topic 데이터 초기화, ClickHouse
  기존 데이터 초기화 또는 보정, Dashboard/Decision query 영향 확인을 함께 처리한다.
- payload/schema 변경은 관련 작업 검증이 끝나기 전까지 완료로 보지 않는다.

## 의존 서비스

- 쓰기: `loop-ad_decision`이 PostgreSQL result contract를 쓴다.
- 읽기: `loop-ad_decision`은 ClickHouse `events`를 읽고, `loop-ad_dashboard`와 Ads serve
  API는 PostgreSQL contract DB와 ClickHouse를 읽는다.
- raw event source: Event Collector 이후 Kafka/ClickHouse pipeline.

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/decision-run.md](../workflows/decision-run.md)
- [../workflows/dashboard-read.md](../workflows/dashboard-read.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-DATA-001`
- `RULE-DATA-002`
- `RULE-EVENT-009`
- `RULE-EVENT-010`
- `RULE-EVENT-011`
- `RULE-EVENT-012`
- `RULE-EVENT-013`
- `RULE-EVENT-014`

## 로컬 검증

서비스 repo의 README를 기준으로 한다.

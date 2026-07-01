# Event Collector Context

## 역할

`loop-ad_event_collector`는 SDK에서 들어오는 HTTP 이벤트를 검증하고 Kafka raw topic으로
요청 body 원문 JSON을 발행하는 Go 서버다.

## 하지 않는 일

- ClickHouse row 생성, 컬럼 매핑, 집계 처리를 담당하지 않는다.
- AI Decision, Dashboard API, Ads serving API를 호출하지 않는다.

## 공개 인터페이스

- HTTP health endpoint.
- HTTP event ingest endpoint.
- Kafka raw event topic write.

## 의존 서비스

- 입력: `loop-ad_event_sdk`
- 출력: Kafka/ClickHouse ingestion pipeline

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)

## 관련 rule

- `RULE-EVENT-003`
- `RULE-SERVICE-002`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

## TODO

- Kafka topic, CORS, payload size 제한을 `origin/main` 기준으로 보강한다.


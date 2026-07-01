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

## HTTP 계약

- `GET /health`: ECS/ALB health check이며 정상 상태에서 `200`과 `ok`를 반환한다.
- `POST /`: SDK 기본 endpoint용 ingest path다.
- `POST /events`: 명시적 ingest path다.
- ingest path는 browser SDK 호출을 위해 `OPTIONS` preflight와
  `Access-Control-Allow-Origin: *`를 지원한다.
- 요청 `Content-Type`은 `application/json`이어야 하며 본문 크기는 최대 256 KiB다.
- 성공 시 `202 Accepted`와 `{"accepted":1}`을 반환한다.
- 빈 본문, 잘못된 JSON, payload 검증 실패는 `400`, 본문 초과는 `413`,
  content type 불일치는 `415`, Kafka 발행 실패는 `503`이다.

## Payload 검증

검증 기준은 `loop-ad_data-source_contract`의 ClickHouse event schema를 따르는 Event SDK
flat payload다.

- 최상위 JSON 객체 1개만 허용한다.
- SDK payload에 없는 top-level field는 거부한다.
- `project_id`, `event_id`, `user_id`, `session_id`, `event_time`, `event_name`,
  `properties_json`은 비어 있으면 안 된다.
- `event_time`은 RFC3339/RFC3339Nano 문자열이어야 한다.
- `properties_json`은 JSON 객체 문자열이어야 한다.
- 숫자 field는 JSON 숫자여야 하며 `quantity`는 0 이상 정수여야 한다.
- payload field 변경이 필요하면 data-source contract 변경과 같은 사이클 안에서 Collector
  validation을 갱신하고 검증한다.

## Kafka 계약

- 발행 topic은 `LOOPAD_EVENT_TOPIC`으로 주입하며 dev 기준 값은
  `loop-ad.events.raw`다.
- Kafka bootstrap broker, security protocol, SASL mechanism, username, password는
  env/secret으로 주입받고 시작 시점에 검증한다.
- 현재 collector가 지원하는 Kafka 연결은 `SASL_PLAINTEXT` +
  `SCRAM-SHA-512`이다.
- Kafka message `key`는 비워 둔다.
- Kafka message `value`는 검증을 통과한 HTTP 요청 body 원문 JSON 바이트다.
- producer는 ack를 기다리는 동기 발행을 사용하고, Kafka publish 실패를 성공으로
  숨기지 않는다.

## 의존 서비스

- 입력: `loop-ad_event_sdk`
- 출력: Kafka/ClickHouse ingestion pipeline

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)

## 관련 rule

- `RULE-EVENT-003`
- `RULE-EVENT-005`
- `RULE-EVENT-008`
- `RULE-EVENT-011`
- `RULE-EVENT-012`
- `RULE-EVENT-013`
- `RULE-SERVICE-002`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

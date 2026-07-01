# Event Pipeline Rules

## RULE-EVENT-001

Event SDK는 `projectId`, `userId`, `sessionId`가 준비된 사용자 행동 이벤트만 Event Collector public endpoint로 전송한다.

## RULE-EVENT-002

Event SDK는 identity가 없는 이벤트를 queue에 넣지 않고 drop한다.

## RULE-EVENT-003

Event Collector는 SDK flat payload를 검증한 뒤 Kafka raw topic `loop-ad.events.raw`로 요청 body 원문 JSON을 발행한다.

## RULE-EVENT-004

ClickHouse 적재, 컬럼 매핑, 집계 처리는 Event Collector 이후 pipeline의 책임이다.

## RULE-EVENT-005

SDK, Collector, ClickHouse가 공유하는 필수 event field는 `project_id`, `event_id`, `user_id`, `session_id`, `event_time`, `event_name`, `properties_json`이다.

## RULE-EVENT-006

`properties_json`은 JSON 객체 문자열이어야 하며 page, sdk, DOM element, custom property처럼 top-level 컬럼이 아닌 값을 담는다.

## RULE-EVENT-007

현재 core 분석 event name은 `page_view`, `product_view`, `add_to_cart`, `checkout_start`, `purchase`, `ad_impression`, `ad_click`이다.

## RULE-EVENT-008

Kafka topic 이름, broker address, security protocol, SASL mechanism, app credential은 infra/runtime env 계약으로 주입하고 application code나 context 문서에 secret 값을 고정하지 않는다.

## RULE-EVENT-009

ClickHouse는 `events_raw_kafka` Kafka source table과 materialized view를 통해 `events` 영구 테이블을 만들며, `events`가 raw event source다.

## RULE-EVENT-010

PostgreSQL contract DB에는 raw ClickHouse event를 복사하지 않고 AI Decision 결과와 serving/read model 계약만 둔다.

## RULE-EVENT-011

event payload field의 기준은 `loop-ad_data-source_contract`의 ClickHouse event schema이며, Event SDK와 Event Collector는 이 계약을 따라야 한다.

## RULE-EVENT-012

event payload field를 바꾸는 변경은 반드시 한 사이클 안에서 최소 Event SDK payload, Event Collector validation, Kafka 기존 raw topic 데이터 초기화, ClickHouse 기존 데이터 초기화 또는 보정, downstream Dashboard/Decision query 영향 확인을 함께 처리한다.

## RULE-EVENT-013

event payload field 변경은 관련 작업 검증이 끝나기 전까지 완료로 보지 않는다.

## RULE-EVENT-014

현재 LoopAd event pipeline은 실제 고객 production data가 아니라 테스트 데이터와 공개 데이터셋 기반이므로, payload/schema 변경 시 기존 더미 데이터 보존보다 Kafka topic, DB, ClickHouse 초기화 또는 더미 값 overwrite 후 재적재를 적극적으로 권장할 수 있다.

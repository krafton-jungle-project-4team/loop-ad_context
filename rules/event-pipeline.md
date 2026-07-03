# Event Pipeline Rules

이 문서는 호텔 예약 도메인 이벤트 흐름에 관한 느슨한 문구 묶음이다. ClickHouse table
정의나 materialized view SQL의 원본으로 쓰지 않는다.

## RULE-EVENT-001

Event SDK는 `hotel_rec_promo.v1` envelope를 Event Collector public endpoint로 전송한다.
project, user, session, event identity가 준비되지 않은 사용자 행동 이벤트는 전송 대상이
아니다.

## RULE-EVENT-002

Event SDK는 attribution에 필요한 identity가 없는 이벤트를 queue에 쌓아 성공처럼 처리하지
않는다. drop 또는 보류 정책은 구현 repo에서 정하되, 수집된 이벤트처럼 downstream에
전파하지 않는다.

## RULE-EVENT-003

Event Collector는 envelope와 프로모션 필수 property를 검증한 뒤 raw JSON을 Kafka/raw event
pipeline으로 넘긴다. Collector가 호텔 분석 결과나 serving assignment를 계산하지 않는다.

## RULE-EVENT-004

ClickHouse 적재, typed table/view, funnel/promotion 집계 처리는 Collector 이후 data
pipeline과 Data Source Contract의 책임이다.

## RULE-EVENT-005

SDK, Collector, ClickHouse가 공유하는 event identity는 `project_id`, `event_id`,
`user_id`, `session_id`, `event_time`, `event_name`, `properties` 또는 `properties_json`을
중심으로 맞춘다.

## RULE-EVENT-006

프로모션, 호텔, 페이지, SDK, DOM, custom 값은 event properties에 담는다. top-level field를
늘릴 때는 downstream query와 storage 계약이 함께 바뀌는지 확인한다.

## RULE-EVENT-007

현재 core event name은 호텔 예약 도메인을 기준으로 한다. 쇼핑몰의 `product_view`,
`add_to_cart`, `purchase`, `ad_impression`, `ad_click`을 새 공통 event name으로 되살리지
않는다.

## RULE-EVENT-008

Kafka topic, broker, security protocol, SASL, credential은 infra/runtime env와 secret 계약으로
주입한다. secret 값은 application code, context 문서, log, metric label에 고정하지 않는다.

## RULE-EVENT-009

ClickHouse의 raw event source는 Data Source Contract가 정한 raw event table/view에서
시작한다. promotion touch, booking outcome, hotel detail, funnel step 같은 분석 view는
그 raw source에서 파생된다.

## RULE-EVENT-010

PostgreSQL contract DB에는 raw ClickHouse event를 복사하지 않는다. PostgreSQL에는 Decision
결과, serving assignment, Dashboard read model에 필요한 계약 데이터를 둔다.

## RULE-EVENT-011

event payload field의 기준은 `loop-ad_data-source_contract`의 호텔 이벤트 계약이다. Event
SDK, Event Collector, Dashboard, Decision은 같은 계약을 따라야 한다.

## RULE-EVENT-012

event payload field를 바꾸는 변경은 한 사이클 안에서 최소 Event SDK payload, Event
Collector validation, Kafka/raw event 처리, ClickHouse reset 또는 backfill, downstream
Dashboard/Decision query 영향을 함께 확인한다.

## RULE-EVENT-013

event payload field 변경은 관련 SDK, Collector, Data Source, Dashboard, Decision 검증이
끝나기 전까지 완료로 보지 않는다.

## RULE-EVENT-014

현재 LoopAd event pipeline은 실제 고객 production data가 아니라 테스트 데이터와 공개
데이터셋 기반이다. payload/schema 변경 시 기존 더미 데이터 보존보다 raw topic, DB,
ClickHouse 초기화 또는 더미 값 재적재를 우선할 수 있다.

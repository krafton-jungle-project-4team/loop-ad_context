# Event Ingestion Workflow

## 목적

브라우저 사용자 행동 이벤트를 SDK에서 수집해 Collector, Kafka, ClickHouse까지 전달한다.

## 참여 서비스

- `loop-ad_event_sdk`
- `loop-ad_event_collector`
- `loop-ad_data-source_contract`
- `loop-ad_infra`
- `loop-ad_demo-shoppingmall_front`
- 후속 읽기: `loop-ad_decision`, `loop-ad_dashboard`

## 흐름

1. Demo front 또는 고객사 페이지가 Event SDK를 초기화한다. `projectId`와 공유
   context를 설정하고, 로그인/세션 준비 후 `setIdentity({ userId, sessionId })`를
   호출한다.
2. Event SDK가 `track()` 호출, page view auto tracking, 또는 `data-loopad-event`
   DOM annotation에서 이벤트를 만든다.
3. Event SDK는 identity가 없는 이벤트를 queue에 넣지 않고 drop한다.
4. Event SDK는 identity가 있는 이벤트를 ClickHouse `events` 컬럼에 맞춘 flat JSON으로
   만들고 `https://event.api.dev.loop-ad.org`에 `POST application/json`으로 전송한다.
5. Event Collector는 `/` 또는 `/events` ingest path에서 CORS preflight, content type,
   256 KiB body limit, SDK payload shape를 검증한다.
6. Event Collector는 검증된 HTTP 요청 body 원문 JSON 바이트를 Kafka topic
   `loop-ad.events.raw`에 발행한다. Kafka message key는 비워 둔다.
7. Kafka broker/topic은 infra가 소유한다. dev Kafka는 단일 raw event topic만 만들고
   auto topic creation을 끈다. 앱은 `LOOPAD_EVENT_TOPIC`과 Kafka app user secret을
   주입받는다.
8. ClickHouse는 `loopad_events_kafka` named collection과 `events_raw_kafka` Kafka engine
   source table로 topic을 소비한다.
9. `events_raw_kafka_to_events` materialized view가 `event_time`을 UTC
   `DateTime64(3)`로 파싱해 영구 `events` table에 적재한다.
10. AI Decision은 ClickHouse `events`를 읽어 segment, action, recommendation, content,
    experiment 결과를 PostgreSQL contract DB에 쓴다.
11. Dashboard API는 ClickHouse `events`를 읽어 이벤트/퍼널 화면을 만들고, AI 결과 화면과
    Ads serving은 PostgreSQL contract DB를 읽는다.

## Payload 계약

- event payload field의 기준은 `loop-ad_data-source_contract`의 ClickHouse event schema다.
  Event SDK와 Event Collector는 이 계약을 따라야 하며 독자적으로 field를 추가/삭제하지
  않는다.
- 필수 field: `project_id`, `event_id`, `user_id`, `session_id`, `event_time`,
  `event_name`, `properties_json`.
- 공통 분석 field: `channel`, `campaign_id`, `age_group`, `gender`, `device`,
  `category`, `product_id`, `inventory_status`, `price`, `quantity`, `revenue`,
  `coupon_id`, `order_id`, `experiment_id`, `variant_id`, `action_id`, `mapping_id`,
  `ad_id`, `creative_id`, `bandit_policy_id`, `bandit_arm_id`,
  `bandit_decision_id`, `reward_value`.
- `properties_json`은 JSON 객체 문자열이다. page, sdk, DOM element, 추가 custom property는
  여기에 둔다.
- SDK/Collector/ClickHouse가 공유하는 top-level field를 바꾸면 같은 변경 사이클 안에서
  최소 Event SDK payload, Event Collector validation, Kafka 기존 raw topic 데이터 초기화,
  ClickHouse 기존 데이터 초기화 또는 보정, downstream Dashboard/Decision query 영향 확인을
  함께 처리한다.
- payload field 변경은 관련 작업 검증이 끝나기 전까지 완료로 보지 않는다.
- 현재 프로젝트는 실제 고객 production data가 아니라 테스트 데이터와 공개 데이터셋 기반이다.
  따라서 payload/schema 변경에서는 기존 더미 데이터 보존보다 Kafka topic, DB, ClickHouse를
  초기화하거나 더미 값으로 overwrite한 뒤 재적재/재생성하는 전략을 적극적으로 권장할 수 있다.

## Event name 계약

- SDK는 custom event name을 허용하지만 현재 core 분석 event는 `page_view`,
  `product_view`, `add_to_cart`, `checkout_start`, `purchase`, `ad_impression`,
  `ad_click`이다.
- `product_view`, `add_to_cart`, `checkout_start`, `purchase`는 commerce funnel 지표와
  `view_to_cart_rate`, `cart_to_checkout_rate`, `checkout_to_purchase_rate`,
  `view_to_purchase_rate` 계산에 사용된다.
- `ad_impression`, `ad_click`, `purchase`는 experiment/creative 성과 집계에 사용된다.
- coupon/custom event를 지표에 포함하려면 SDK 문서뿐 아니라 Dashboard shared event
  schema, Dashboard/Decision query, 화면 모델까지 함께 확인한다.

## 책임 경계

- SDK는 브라우저 capture와 HTTP 전송만 담당한다.
- Collector는 HTTP 검증과 Kafka raw topic 발행까지만 담당한다.
- Kafka topic 소유와 runtime env/secret 주입은 infra 계약이다.
- ClickHouse는 Kafka topic을 소비해 raw event source인 `events`를 유지한다.
- PostgreSQL은 raw event 저장소가 아니며 AI Decision 결과 공유 계약이다.

## 관련 rule

- `RULE-EVENT-001`
- `RULE-EVENT-002`
- `RULE-EVENT-003`
- `RULE-EVENT-004`
- `RULE-EVENT-005`
- `RULE-EVENT-006`
- `RULE-EVENT-007`
- `RULE-EVENT-008`
- `RULE-EVENT-009`
- `RULE-EVENT-010`
- `RULE-EVENT-011`
- `RULE-EVENT-012`
- `RULE-EVENT-013`
- `RULE-EVENT-014`

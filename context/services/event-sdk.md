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

## 수집 계약

- `init({ projectId })`의 `projectId`는 Collector payload의 `project_id`가 되며 비어
  있을 수 없다.
- Event Collector endpoint는 SDK 옵션이 아니라 infra public domain 계약이며
  `https://event.api.dev.loop-ad.org`로 고정한다.
- SDK는 `userId`와 `sessionId`를 직접 만들지 않는다. `identity`가 없으면 이벤트를
  queue에 보관하지 않고 drop한다.
- 최초 `identity` 설정 시 `autoTrackPageViews`가 켜져 있으면 현재 페이지를
  `page_view`로 1회 기록한다. SPA URL 변경도 History API와 `popstate`/`hashchange`
  listener로 `page_view`를 만든다.
- `collectDomEvents`가 켜져 있으면 `data-loopad-event` 요소를 document delegation으로
  수집한다. 기본 listen event는 `form -> submit`, `select -> change`,
  checkbox/radio input -> `change`, 그 외 요소 -> `click`이다.
- DOM field는 `data-loopad-*` allowlist만 top-level context로 읽고,
  `data-loopad-prop-*` 값은 `properties_json`에 들어간다. 입력값, token, secret,
  credential은 payload에 넣지 않는다.

## Payload 계약

SDK는 `loop-ad_data-source_contract`의 ClickHouse `events` schema에 맞춘 flat JSON을
`POST`로 전송한다. payload field 기준은 SDK가 아니라 data-source contract다.

- 필수 top-level field: `project_id`, `event_id`, `user_id`, `session_id`,
  `event_time`, `event_name`, `properties_json`.
- 공통 context field: `channel`, `campaign_id`, `age_group`, `gender`, `device`,
  `category`, `product_id`, `inventory_status`, `price`, `quantity`, `revenue`,
  `coupon_id`, `order_id`, `experiment_id`, `variant_id`, `action_id`, `mapping_id`,
  `ad_id`, `creative_id`, `bandit_policy_id`, `bandit_arm_id`,
  `bandit_decision_id`, `reward_value`.
- 문자열 field는 비어 있으면 빈 문자열로, 숫자 field는 finite number가 아니면 `0`으로
  보낸다. `price`와 `revenue`는 소수점 둘째 자리, `quantity`는 0 이상 정수로
  정규화한다.
- `properties_json`은 JSON 객체 문자열이며 기본적으로 page 정보와 SDK 정보를 담는다.
  DOM 수집 시 element metadata와 `data-loopad-prop-*` 값이 추가된다.
- payload field 변경이 필요하면 data-source contract 변경과 같은 사이클 안에서 SDK
  payload를 갱신하고 검증한다.

## Event name 계약

- SDK는 `track(eventName)`의 문자열 이벤트명을 강제로 제한하지 않는다.
- 현재 분석/대시보드/실험 결과가 우선 집계하는 core event name은 `page_view`,
  `product_view`, `add_to_cart`, `checkout_start`, `purchase`, `ad_impression`,
  `ad_click`이다.
- custom/coupon event name을 추가해도 Collector와 ClickHouse 적재는 가능하지만, 해당
  이벤트를 Decision/Dashboard 지표로 쓰려면 consumer 쿼리와 shared schema를 함께
  갱신해야 한다.

## 의존 서비스

- 쓰기: `loop-ad_event_collector`
- 사용처: `loop-ad_demo-shoppingmall_front`

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-EVENT-001`
- `RULE-EVENT-002`
- `RULE-EVENT-005`
- `RULE-EVENT-006`
- `RULE-EVENT-007`
- `RULE-EVENT-011`
- `RULE-EVENT-012`
- `RULE-EVENT-013`
- `RULE-SERVICE-001`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

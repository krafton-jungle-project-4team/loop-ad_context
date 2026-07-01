# Ad Serving Workflow

## 목적

데모 프론트 또는 고객사 화면에서 광고 지면을 채우고, 노출/클릭 tracking이 이벤트 수집
흐름으로 이어지게 한다.

## 참여 서비스

- `loop-ad_advertisement_sdk`
- `loop-ad_dashboard`
- `loop-ad_demo-shoppingmall_front`
- `loop-ad_event_sdk`
- `loop-ad_data-source_contract`
- `loop-ad_decision`

## 흐름

1. Advertisement SDK가 placement와 사용자 context로 Ads serve API에 요청한다.
2. Ads serve API가 PostgreSQL contract DB에서 serving 가능한 광고 후보를 읽는다.
3. 광고 소재와 tracking payload를 반환한다.
4. Advertisement SDK가 지정된 지면에 광고를 렌더링한다.
5. 노출/클릭 이벤트는 Event SDK를 통해 Event Collector로 전송된다.

## 관련 rule

- `RULE-AD-001`
- `RULE-AD-002`
- `RULE-EVENT-001`

# Service Boundaries Rules

이 문서는 서비스 책임 경계에 관한 느슨한 문구 묶음이다. 문구는 schema가 아니며,
context 평가 시 의미 판단의 기준으로 사용한다.

## RULE-SERVICE-001

브라우저 SDK는 backend data store, Kafka, AWS secret에 직접 접근하지 않는다.

## RULE-SERVICE-002

Event Collector는 HTTP 이벤트 검증과 Kafka raw topic 발행까지만 담당한다.

## RULE-SERVICE-003

Dashboard API와 Ads serve API는 request path에서 AI Decision을 직접 호출하지 않는다.

## RULE-SERVICE-004

현재 제품 판단은 registry의 "사용하는 것"에 있는 repository만 기준으로 한다.


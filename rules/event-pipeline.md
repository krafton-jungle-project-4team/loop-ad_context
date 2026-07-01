# Event Pipeline Rules

## RULE-EVENT-001

Event SDK는 identity가 준비된 사용자 행동 이벤트를 Event Collector public endpoint로 전송한다.

## RULE-EVENT-002

Event SDK는 identity가 없는 이벤트를 queue에 넣지 않고 drop한다.

## RULE-EVENT-003

Event Collector는 SDK payload를 검증한 뒤 Kafka raw topic으로 요청 body 원문 JSON을 발행한다.

## RULE-EVENT-004

ClickHouse 적재, 컬럼 매핑, 집계 처리는 Event Collector 이후 pipeline의 책임이다.


# Domain Model

LoopAd는 사용자 행동 이벤트를 수집하고, 행동 데이터를 분석해 고객군과 마케팅 액션을
생성한 뒤, 광고/대시보드 경로에서 그 결과를 읽어 사용하는 시스템이다.

## Core Flow

1. Event SDK가 브라우저에서 사용자 행동 이벤트를 만든다.
2. Event Collector가 SDK payload를 검증하고 Kafka raw topic으로 원문 JSON을 발행한다.
3. ClickHouse가 raw event를 분석 가능한 이벤트 테이블로 저장한다.
4. AI Decision이 ClickHouse 이벤트를 읽어 segment, recommendation, content, experiment 결과를 만든다.
5. AI Decision은 결과를 PostgreSQL contract DB에 쓴다.
6. Dashboard API와 Ads serving API는 AI Decision을 직접 호출하지 않고 contract DB와 ClickHouse를 읽는다.
7. Demo front는 Event SDK와 Advertisement SDK를 통해 수집과 광고 노출 흐름을 검증한다.

## Boundary

서비스별 세부 책임은 [../services](../services)를 본다. 여러 서비스가 엮이는 흐름은
[../workflows](../workflows)를 본다.

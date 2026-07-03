# Data Source Contract Rules

이 문서는 Data Source Contract의 cross-repo 책임에 관한 느슨한 문구 묶음이다. PostgreSQL
DDL이나 ClickHouse SQL의 원본으로 쓰지 않는다.

## RULE-DATA-001

Data Source Contract는 PostgreSQL 호텔 도메인 core schema와 ClickHouse 호텔 이벤트
table/view 계약을 관리한다. service repository는 공통 `schema.sql`을 중복 관리하지 않는다.

## RULE-DATA-002

PostgreSQL contract DB에는 Decision 결과, serving assignment, Dashboard read model 계약을
둔다. ClickHouse에는 raw event source와 호텔 이벤트 분석 view를 둔다.

## RULE-DATA-003

Serving과 evaluation을 잇는 데이터에는 `ad_experiment_id`, `promotion_run_id`, `segment_id`,
content identifier가 함께 추적 가능해야 한다.

## RULE-DATA-004

Dashboard 광고 실행은 `user_segment_assignments`와 active serving assignment view 또는 동등
query를 읽어 동작할 수 있어야 한다.

## RULE-DATA-005

Segment query preview, segment definition, ChatKit action persistence는 Dashboard와 Decision이
같은 DB 계약을 보고 해석할 수 있어야 한다.

## RULE-DATA-006

규칙 문서에는 table column과 index를 길게 복제하지 않는다. schema 세부사항은 Data Source
Contract repository와 최종 reference 문서에서 관리한다.

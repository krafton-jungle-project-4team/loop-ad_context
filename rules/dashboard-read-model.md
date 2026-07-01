# Dashboard Read Model Rules

## RULE-DASHBOARD-001

Dashboard API는 AI Decision을 직접 호출하지 않고 PostgreSQL contract DB와 ClickHouse를 읽는다.

## RULE-DASHBOARD-002

Dashboard는 외부 DB/API 실패를 mock success나 fallback 데이터로 숨기지 않는다.

## RULE-DASHBOARD-003

Dashboard web client는 API 응답을 화면에 표시하고 분석 job 실행 책임을 갖지 않는다.


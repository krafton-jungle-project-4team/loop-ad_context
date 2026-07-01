# Dashboard Read Workflow

## 목적

Dashboard가 raw event와 AI Decision 결과를 조회해 분석 화면을 보여준다.

## 참여 서비스

- `loop-ad_dashboard`
- `loop-ad_data-source_contract`
- `loop-ad_decision`

## 흐름

1. AI Decision이 PostgreSQL contract DB에 분석/추천/콘텐츠/실험 결과를 쓴다.
2. ClickHouse는 raw event source와 성과 이벤트를 보관한다.
3. Dashboard API가 PostgreSQL과 ClickHouse를 읽는다.
4. Dashboard web client가 API 응답을 표시한다.

## 관련 rule

- `RULE-DASHBOARD-001`
- `RULE-DASHBOARD-002`
- `RULE-DATA-001`

## TODO

- API endpoint 목록, 화면별 query source, error 표시 정책을 보강한다.


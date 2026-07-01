# Decision Run Workflow

## 목적

ClickHouse 행동 데이터를 분석해 segment, recommendation, content, experiment 결과를 만들고
PostgreSQL contract DB에 저장한다.

## 참여 서비스

- `loop-ad_decision`
- `loop-ad_data-source_contract`
- `loop-ad_dashboard`

## 흐름

1. AI Decision job이 실행된다.
2. ClickHouse raw event source를 읽는다.
3. 고객군과 마케팅 액션을 계산한다.
4. 콘텐츠와 실험 관련 결과를 만든다.
5. PostgreSQL contract DB에 결과를 쓴다.
6. Dashboard API와 Ads serve API가 이 결과를 읽는다.

## 관련 rule

- `RULE-AI-001`
- `RULE-AI-002`
- `RULE-DATA-002`

## TODO

- daily/manual/demo job 차이와 failure/idempotency 규칙을 보강한다.


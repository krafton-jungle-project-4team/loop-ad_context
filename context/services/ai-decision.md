# AI Decision Context

## 역할

`loop-ad_decision`은 사용자 행동을 분석하고 segment, marketing action, recommendation,
content, experiment 결과를 생성하는 AI/decision service다.

## 하지 않는 일

- Dashboard API나 Ads serving API의 request path에서 직접 호출되는 online serving service가 아니다.
- raw ClickHouse event를 PostgreSQL에 복사하는 service가 아니다.

## 공개 인터페이스

- Dev API service domain: `https://decision.api.dev.loop-ad.org`.
- PostgreSQL contract DB write model: decision run, segment, anomaly, recommendation,
  content, experiment, serving mapping, and segment matching tables.
- ClickHouse read model: `events` behavior event table.

## 의존 서비스

- 읽기: ClickHouse raw event source.
- 쓰기: PostgreSQL contract DB.
- 소비자: `loop-ad_dashboard` API와 Ads serve API.

## 관련 workflow

- [../workflows/decision-run.md](../workflows/decision-run.md)
- [../workflows/dashboard-read.md](../workflows/dashboard-read.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-AI-001`
- `RULE-AI-002`
- `RULE-DASHBOARD-001`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

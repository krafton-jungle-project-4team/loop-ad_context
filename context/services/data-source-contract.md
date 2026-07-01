# Data Source Contract Context

## 역할

`loop-ad_data-source_contract`는 LoopAd 서비스들이 공유하는 PostgreSQL/ClickHouse 데이터
소스 계약과 로컬 실행 설정을 관리한다.

## 하지 않는 일

- 운영 migration history 전체를 관리하지 않는다.
- 서비스별 application logic을 담지 않는다.

## 공개 인터페이스

- PostgreSQL schema contract.
- ClickHouse schema contract.
- 로컬 Docker Compose와 local env example.

## 의존 서비스

- 쓰기: `loop-ad_decision`.
- 읽기: `loop-ad_dashboard`, Ads serve API.
- raw event source: Event Collector 이후 Kafka/ClickHouse pipeline.

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/decision-run.md](../workflows/decision-run.md)
- [../workflows/dashboard-read.md](../workflows/dashboard-read.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-DATA-001`
- `RULE-DATA-002`

## 로컬 검증

서비스 repo의 README를 기준으로 한다.

## TODO

- active views, default segment fallback, serving contract table 설명을 보강한다.


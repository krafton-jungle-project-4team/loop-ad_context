# Glossary

공통 용어는 서비스별 README에서 반복 정의하지 않고 이 문서를 우선 참조한다.

## Terms

- project_id / projectId: 고객사 또는 데모 서비스를 식별하는 public project key.
- user_id / userId: 고객사 서비스에서 전달하는 사용자 식별자.
- session_id / sessionId: 고객사 서비스에서 전달하는 세션 식별자.
- event: SDK가 수집하고 Collector가 Kafka로 전달하는 사용자 행동 기록.
- raw event: ClickHouse에 저장되는 행동 이벤트 원천 데이터.
- segment: AI Decision이 분석 결과로 생성하거나 갱신하는 고객군.
- action: 특정 고객군에 적용할 마케팅 액션.
- creative: 광고나 콘텐츠로 노출되는 소재.
- experiment: 액션과 소재를 검증하기 위한 실험 단위.
- placement: 데모 프론트 또는 고객사 화면에서 광고가 렌더링되는 지면.
- contract DB: AI Decision이 쓰고 Dashboard/Ads serving이 읽는 PostgreSQL 계약 DB.

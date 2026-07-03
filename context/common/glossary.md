# Glossary

공통 용어는 서비스별 README에서 반복 정의하지 않고 이 문서를 우선 참조한다.

## Terms

- project_id / projectId: 고객사 또는 데모 서비스를 식별하는 public project key.
- user_id / userId: 고객사 서비스에서 전달하는 사용자 식별자.
- session_id / sessionId: 고객사 서비스에서 전달하는 세션 식별자.
- event: SDK가 수집하고 Collector가 Kafka로 전달하는 사용자 행동 기록.
- raw event: ClickHouse에 저장되는 행동 이벤트 원천 데이터.
- campaign: 큰 마케팅 기획 단위.
- promotion: 캠페인 안의 채널별 실행 단위.
- promotion_run: 프로모션의 n번째 실행 또는 재실험 루프를 묶는 단위.
- segment: 프로모션에서 타겟팅할 고객군. 캠페인 전체에 고정하지 않고 프로모션별로 관리한다.
- segment tab: 프로모션 상세에서 특정 세그먼트의 요약, 지표, 집계, 퍼널, 발송 상태,
  배너 조회/클릭률을 함께 보는 작업 단위.
- action: 특정 고객군에 적용할 마케팅 액션.
- creative: 광고나 콘텐츠로 노출되는 소재.
- experiment: 액션과 소재를 검증하기 위한 실험 단위.
- ad_experiment: 특정 promotion_run 안에서 세그먼트별로 생성되는 광고 실험.
- placement: 데모 프론트 또는 고객사 화면에서 광고가 렌더링되는 지면.
- contract DB: AI Decision이 쓰고 Dashboard/Ads serving이 읽는 PostgreSQL 계약 DB.

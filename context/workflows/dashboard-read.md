# Dashboard Read Workflow

## 목적

Dashboard가 raw event와 AI Decision 결과를 조회해 프로젝트, 캠페인, 프로모션, 세그먼트
단위의 분석 화면을 보여준다.

## 참여 서비스

- `loop-ad_dashboard`
- `loop-ad_data-source_contract`
- `loop-ad_decision`

## 흐름

1. AI Decision이 PostgreSQL contract DB에 분석/추천/콘텐츠/실험 결과를 쓴다.
2. ClickHouse는 raw event source와 성과 이벤트를 보관한다.
3. Dashboard API가 PostgreSQL과 ClickHouse를 읽는다.
4. Dashboard web client가 프로젝트 → 캠페인 → 프로모션 → 세그먼트 계층에 맞게 API 응답을 표시한다.
5. 프로모션 상세에서는 여러 세그먼트를 탭 형태의 작업 단위로 열어 세그먼트별 지표를
   프로모션 전체 지표와 비교한다.
6. 세그먼트 상세에서는 세그먼트 요약, 지표, 집계, 퍼널, SMS/Email 발송 상태, 배너
   조회/클릭률을 함께 표시한다.

## 화면별 조회 범위

- 캠페인 목록: campaign 상태, promotion 수, segment 수, ad_experiment 수, 목표 달성률,
  다음 액션.
- 캠페인 상세: 캠페인 요약, 마케팅 기획, 캠페인 실시간 지표, 프로모션 집계, 워크플로우
  View, 프로모션 목록.
- 프로모션 목록: promotion 상태, goal metric, segment 요약, ad_experiment 수, 목표 달성률.
- 프로모션 상세: promotion 요약, 세그먼트 목록, 프로모션 실시간 지표, 퍼널, 세그먼트 집계.
- 세그먼트 상세: segment 조건, 대상 규모, 연결된 ad_experiment, 생성 콘텐츠와 이유,
  세그먼트 실시간 지표.

## 조회 경계

- Dashboard 단순 조회는 Decision API를 반복 호출하지 않는다.
- 자연어 세그먼트 조회, SQL preview, 사용자 정의 세그먼트 저장, ChatKit action 처리는
  Dashboard API 책임이다.
- 퍼널은 project, promotion, channel에 맞게 수정 가능한 정의로 관리한다.

## 관련 rule

- `RULE-DASHBOARD-001`
- `RULE-DASHBOARD-002`
- `RULE-DASHBOARD-003`
- `RULE-DASHBOARD-004`
- `RULE-DASHBOARD-008`
- `RULE-DASHBOARD-009`
- `RULE-DASHBOARD-010`
- `RULE-DASHBOARD-011`
- `RULE-DASHBOARD-012`
- `RULE-DATA-001`

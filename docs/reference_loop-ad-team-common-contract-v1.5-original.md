# Loop-Ad 팀 공통 구현 계약서 v1.5 Full

> 대상 팀: Dashboard, Dashboard 광고 실행 모듈, AI Decision, 수집/SDK, Data Source Contract, Demo Front, Infra  
> 기준 도메인: **호텔/숙박 예약**  
> 기존 레포 상태: 여러 레포가 shopping mall / product / purchase / recommendation / experiment 중심으로 구현되어 있음  
> 최종 목표: 기존 코드를 호텔 도메인과 아래 공통 계약으로 이관한다. 필요하면 기존 구현을 지워도 되지만, **`.github` 디렉터리와 기존 환경변수 이름은 반드시 유지**한다.

---

## 0. 최상위 원칙

### 0.1 서비스 계층

Loop-Ad의 사용자-facing 계층은 아래로 고정한다.

```text
Campaign
└── Promotion
    └── Segment
        └── Ad Experiment
```

| 계층 | 의미 | 예시 |
|---|---|---|
| Campaign | 큰 마케팅 기획 단위 | 2026 여름 특가 세일 |
| Promotion | 캠페인 안의 채널별 실행 단위 | Email, SMS, 내부 사이트 배너 |
| Segment | 해당 프로모션에서 타겟팅할 고객군 | 체크인 임박 고객, 가족 여행 고객 |
| Ad Experiment | 특정 세그먼트에 대해 실제로 실행되는 광고 실험 | 체크인 임박 고객용 SMS 재실험 |

고정 규칙:

```text
1. 세그먼트는 캠페인 전체에 고정하지 않는다.
2. 세그먼트는 프로모션별로 생성되거나 사용자가 정의한다.
3. 광고 실험은 세그먼트별로 생성된다.
4. MVP에서는 같은 promotion_run 안에서 segment_id당 ad_experiment_id는 1개만 존재한다.
5. 목표 미달 시 성공 세그먼트는 유지하고, 실패 세그먼트만 다시 분석 → 생성 → 실험한다.
```

---

### 0.2 이번 v1.5에서 추가 확정된 핵심 기능

v1.4는 계층과 세그먼트당 광고 실험 1개 규칙을 정의했다. v1.5는 여기에 코치님 피드백을 반영해 **실제 데이터 분석 시스템처럼 보이는 기능**을 추가한다.

추가 기능:

```text
1. 실시간 추이 페이지
2. 퍼널 페이지
3. 세그먼트 페이지
   - 자연어 → SQL 생성
   - SQL preview
   - 결과 테이블 조회
   - sample size 검증
   - 사용자 정의 세그먼트 저장
4. ChatKit 기반 챗봇
   - 세그먼트 조회/생성
   - SQL 생성/실행 전 확인
   - 광고 재생성
   - 목표 미달 재실험
   - 결과 설명
5. AI 생성 페이지의 생성 이유/근거 리포트
6. Campaign → Promotion → Segment → Ad Experiment 워크플로우 DAG 페이지
```

---

### 0.3 기존 shopping mall 구현 이관 원칙

현재 repo에 shopping mall 기준 코드가 있으면 호텔 도메인 기준으로 이관한다.

```text
product_id             → hotel_id 또는 hotel_cluster
product_view           → hotel_detail_view
product_click          → hotel_click
add_to_cart            → 사용하지 않음. 필요 시 booking_start로 매핑
checkout_start         → booking_start
purchase / purchase_success → booking_complete
ad_impression          → promotion_impression
ad_click               → promotion_click
conversion_rate        → booking_conversion_rate 또는 inflow_rate
cart_abandoner         → hotel_detail_no_booking / booking_start_no_complete 같은 호텔 기준 세그먼트
```

허용:

```text
- 기존 shopping mall 코드를 완전히 지우고 호텔 도메인으로 재작성해도 된다.
- 단, .github 디렉터리와 기존 GitHub Actions workflow는 삭제하지 않는다.
- 기존 repo가 사용하던 env 이름은 rename하지 않는다.
- 신규 env가 필요하면 추가만 한다.
```

금지:

```text
- .github 삭제
- 기존 deploy workflow 삭제
- 기존 env 이름 변경
- 앱 코드에서 필수 env fallback/default 추가
- DB schema.sql을 서비스 repo에 중복 생성
- secret/API key를 FE bundle, 로그, metric label, plain GitHub Actions env에 노출
```

---

### 0.4 인프라/배포 계약

모든 서버 앱은 인프라 app repository guide를 따른다.

공통 서버 규칙:

```text
1. 필수 env에 fallback/default를 두지 않는다.
2. 서버 시작 시 필수 env를 검증하고 없으면 즉시 실패한다.
3. secret/token/password/API key를 repo, Docker image, GitHub Actions plain env, 로그, metric label, FE bundle에 남기지 않는다.
4. 앱 코드는 Secrets Manager나 SSM Parameter Store를 직접 조회하지 않는다.
5. 서버는 PORT env를 읽고 0.0.0.0:${PORT}로 listen한다.
6. 모든 서버는 /health에서 정상 상태일 때 HTTP 200을 반환한다.
7. /internal/* 요청은 X-Loop-Ad-Internal-Key header를 검증한다.
```

유지해야 하는 공통 env 이름:

```text
LOOPAD_ENV
LOOPAD_SERVICE_ID
PORT
LOOPAD_INTERNAL_API_KEY

LOOPAD_AURORA_HOST
LOOPAD_AURORA_PORT
LOOPAD_AURORA_DATABASE
LOOPAD_AURORA_USERNAME
LOOPAD_AURORA_PASSWORD

LOOPAD_CLICKHOUSE_URL
LOOPAD_CLICKHOUSE_DATABASE
LOOPAD_CLICKHOUSE_USERNAME
LOOPAD_CLICKHOUSE_PASSWORD

LOOPAD_KAFKA_BOOTSTRAP_BROKERS
LOOPAD_KAFKA_SECURITY_PROTOCOL
LOOPAD_KAFKA_SASL_MECHANISM
LOOPAD_KAFKA_USERNAME
LOOPAD_KAFKA_PASSWORD
LOOPAD_EVENT_TOPIC

LOOPAD_DATA_STORAGE_BUCKET
LOOPAD_OPENAI_API_KEY
```

GenAI asset prefix env는 레포별 기존 이름을 우선 유지한다.

```text
기존 앱이 LOOPAD_GENAI_GENERATED_ASSETS_PREFIX를 사용하면 그대로 유지한다.
기존 앱이 LOOPAD_GENAI_ASSETS_BASE_PREFIX를 사용하면 그대로 유지한다.
둘 중 하나로 강제 rename하지 않는다.
필요하면 compatibility function에서 두 env를 모두 읽되, repo 내부 public contract는 기존 이름을 유지한다.
```

Dev 인프라 대상 서버:

```text
event-collector
dashboard-api
decision-api
```

`advertisement-api`는 별도 dev 인프라 대상이 아니다. 광고 실행 기능은 Dashboard API 서버 내부 모듈로 구현한다.

Public API domain 계약:

```text
Event Collector: https://event.api.dev.loop-ad.org
Dashboard API:  https://dashboard.api.dev.loop-ad.org
Decision API:   https://decision.api.dev.loop-ad.org
```

Frontend 정적 사이트 계약:

```text
Dashboard Web:       https://dashboard.dev.loop-ad.org
Demo shoppingmall Web: https://demo-shoppingmall.dev.loop-ad.org
```

주의: demo repo 이름과 public domain은 `demo-shoppingmall`이어도, 화면/도메인/이벤트 내용은 호텔 예약 데모로 바꾼다. 배포 이름을 무리하게 바꾸지 않는다.

---

## 1. 최종 페이지 구조

Dashboard Web의 핵심 페이지는 아래 7개로 고정한다.

```text
1. 메인 대시보드
2. 마케팅 기획서
3. 실시간 추이
4. 퍼널
5. 세그먼트
6. AI 생성
7. 워크플로우
```

추가 유틸리티 페이지:

```text
8. 설정 / SDK
```

---

### 1.1 메인 대시보드

역할:

```text
캠페인 목록과 현재 상태를 보여준다.
새 캠페인을 만들거나 기존 캠페인으로 들어간다.
```

필수 표시:

```text
project_id
project_name
활성 캠페인 수
검수 대기 캠페인 수
진행 중 캠페인 수
최근 이벤트 수
최근 이벤트 수집 시각
캠페인 목록
```

캠페인 카드 필드:

```text
campaign_id
campaign_name
objective
status
promotion_count
segment_count
ad_experiment_count
current_goal_achievement_rate
next_action
```

---

### 1.2 마케팅 기획서

역할:

```text
관리자가 캠페인과 하위 프로모션을 생성한다.
```

입력:

```text
campaign_name
objective
target_audience
start_date
end_date
max_loop_count
campaign_brief
```

프로모션 입력:

```text
promotion_id 자동 생성
channel = email | sms | onsite_banner
marketing_theme = summer_sale
target_audience = existing_users
goal_metric = inflow_rate | booking_conversion_rate
goal_target_value
goal_basis = promotion_average | all_segments
message_brief (optional)
offer_type
landing_url
```

Golden Scenario 프로모션:

```text
Email: inflow_rate 10%, promotion_average
내부 배너: booking_conversion_rate 3%, all_segments
SMS: inflow_rate 8%, all_segments
```

---

### 1.3 실시간 추이

역할:

```text
피크타임 행동 이벤트와 실시간 예약/구매 추이를 보여준다.
기존 사이트의 실시간 추이 페이지를 호텔 도메인 이벤트로 교체한다.
```

필수 차트:

```text
1. 최근 5분/1시간 이벤트 수
2. event_name별 추이
3. promotion_id별 클릭/랜딩/예약 추이
4. hotel_search → hotel_click → booking_complete 실시간 funnel count
5. 피크타임 표시
```

필수 이벤트:

```text
page_view
promotion_impression
promotion_click
campaign_redirect_click
campaign_landing
hotel_search
hotel_click
hotel_detail_view
booking_start
booking_complete
booking_cancel
```

필수 필터:

```text
project_id
campaign_id
promotion_id
channel
segment_id
event_name
time_range
```

---

### 1.4 퍼널

역할:

```text
사이트별 전환 단계를 정의하고, 각 단계별 전환율과 병목을 보여준다.
```

기본 호텔 퍼널:

```text
page_view
→ hotel_search
→ hotel_click
→ hotel_detail_view
→ booking_start
→ booking_complete
```

프로모션 퍼널:

```text
Email/SMS 기본 퍼널:
campaign_redirect_click
→ campaign_landing

이후 예약 전환 퍼널은 promotion.landing_type에 따라 결정한다.

landing_type = search_page:
campaign_landing → hotel_search → hotel_detail_view → booking_start → booking_complete

landing_type = hotel_detail_page:
campaign_landing → hotel_detail_view → booking_start → booking_complete

landing_type = booking_resume:
campaign_landing → booking_start → booking_complete

Onsite banner:
promotion_impression
→ promotion_click
→ hotel_search 또는 hotel_detail_view
→ booking_complete
```

퍼널 설정 기능:

```text
1. funnel_definition 생성
2. funnel_step 순서 설정
3. event_name 매핑
4. URL/page_path 조건 optional 설정
5. promotion/channel별 퍼널 저장
```

주의:

```text
숙박 사이트마다 퍼널 이벤트가 다를 수 있으므로, 퍼널은 하드코딩하지 않는다.
기본 호텔 퍼널 fixture를 제공하되 Dashboard에서 수정 가능해야 한다.
```

---

### 1.5 세그먼트 페이지

역할:

```text
AI가 프로모션 입력을 기반으로 세그먼트를 제안하고,
관리자가 자연어/챗봇/조건식으로 세그먼트를 조회하거나 직접 정의한다.
```

필수 기능:

```text
1. AI 추천 세그먼트 목록 표시
2. 자연어 세그먼트 조회
3. 자연어 → SQL 생성
4. 생성 SQL 표시
5. SQL 실행 결과 테이블 표시
6. sample size 검증 (SQL 조회에서는 sample size 고려하지않음)
7. 사용자 정의 세그먼트 저장
8. ChatKit 챗봇으로 세그먼트 생성/조회
```

자연어 예시:

```text
최근 7일간 같은 hotel_cluster를 3회 이상 조회했고 booking_complete가 없는 사용자 찾아줘.

서울 지역 호텔을 2회 이상 클릭했지만 예약하지 않은 기존 사용자 보여줘.

체크인까지 7일 이하인데 아직 예약 완료가 없는 사용자를 세그먼트로 만들고 싶어.
```

AI 생성 SQL 예시:

```sql
WITH repeated_views AS (
    SELECT
        project_id,
        user_id,
        hotel_cluster,
        count() AS detail_view_count,
        max(event_time) AS last_view_at
    FROM hotel_detail_events
    WHERE project_id = {project_id:String}
      AND event_time >= now() - INTERVAL 7 DAY
    GROUP BY project_id, user_id, hotel_cluster
    HAVING detail_view_count >= 3
), bookings AS (
    SELECT DISTINCT
        project_id,
        user_id,
        hotel_cluster
    FROM booking_outcome_events
    WHERE project_id = {project_id:String}
      AND event_name = 'booking_complete'
      AND event_time >= now() - INTERVAL 7 DAY
)
SELECT
    rv.user_id,
    rv.hotel_cluster,
    rv.detail_view_count,
    rv.last_view_at
FROM repeated_views rv
LEFT JOIN bookings b
    ON rv.project_id = b.project_id
   AND rv.user_id = b.user_id
   AND rv.hotel_cluster = b.hotel_cluster
WHERE b.user_id IS NULL
LIMIT 500;
```

세그먼트 저장 가능 조건:

```text
segment_user_count >= max(100, total_eligible_user_count * 0.005)
```

기본값:

```text
min_segment_user_count = 100
min_segment_ratio = 0.5%
max_preview_rows = 500
query_timeout_seconds = 10
```

SQL 안전 규칙:

```text
1. AI가 생성한 SQL은 바로 실행하지 않고 반드시 preview로 보여준다.
2. 허용 SQL은 SELECT 또는 WITH SELECT만 가능하다.
3. INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/CREATE 금지.
4. project_id 조건이 반드시 포함되어야 한다.
5. LIMIT이 반드시 포함되어야 한다.
6. query timeout을 둔다.
7. query result는 user_id raw list를 제한적으로 보여주고, export는 MVP에서 금지한다.
```

세그먼트 저장 객체:

```json
{
  "segment_id": "seg_repeat_hotel_no_booking",
  "segment_name": "같은 숙소 반복 조회 후 미예약 고객",
  "source": "custom_chatkit",
  "natural_language_query": "최근 7일간 같은 hotel_cluster를 3회 이상 조회했고 booking_complete가 없는 사용자",
  "generated_sql": "...",
  "sample_size": 1342,
  "sample_ratio": 0.018,
  "status": "active"
}
```

---

### 1.6 AI 생성

역할:

```text
프로모션별/세그먼트별 광고 콘텐츠를 생성하고, 왜 생성했는지 리포트를 보여준다.
```

기존 AI 생성 페이지에 반드시 추가할 것:

```text
1. 생성 콘텐츠 카드
2. 세그먼트별 생성 이유
3. 데이터 근거
4. 사용한 세그먼트 조건 또는 SQL 요약
5. 생성 메시지 방향
6. 선택한 호텔 도메인 근거
7. 예상 효과
8. 관리자가 승인/거절/재생성할 수 있는 버튼
```

생성 리포트 예시:

```json
{
  "segment_id": "seg_repeat_hotel_no_booking",
  "segment_name": "같은 숙소 반복 조회 후 미예약 고객",
  "reason_summary": "최근 7일 동안 같은 숙소를 3회 이상 조회했지만 예약하지 않은 사용자는 가격/조건 비교 단계에 있을 가능성이 높습니다.",
  "data_evidence": {
    "sample_size": 1342,
    "booking_conversion_rate": 0.018,
    "comparison_group_conversion_rate": 0.034,
    "top_common_features": ["same_hotel_repeat_view", "near_checkin", "mobile"]
  },
  "message_strategy": "무료 취소, 당일 예약 가능성, 조식 포함 조건을 앞에 배치합니다.",
  "content_candidates": []
}
```

---

### 1.7 워크플로우

역할:

```text
Campaign → Promotion → Segment → Ad Experiment 구조와 현재 진행 상태를 DAG/flow 형태로 보여준다.
```

표시 계층:

```text
Campaign node
→ Promotion node
→ Segment node
→ Ad Experiment node
→ Evaluation node
→ Next Loop node optional
```

노드 상태:

```text
planned
running
goal_met
goal_not_met
insufficient_data
next_loop_created
stopped
```

예시:

```text
2026 여름 특가 세일
├── Email
│   ├── 모바일 탐색 → ad_exp_email_mobile_001 → goal_met
│   ├── 가족 여행 → ad_exp_email_family_001 → goal_near
│   ├── 체크인 임박 → ad_exp_email_checkin_001 → goal_not_met → next_loop
│   └── 기존 전체 → ad_exp_email_all_001 → goal_met
├── 내부 배너
│   ├── 가족 여행 → ad_exp_banner_family_001 → goal_met
│   ├── 모바일 탐색 → ad_exp_banner_mobile_001 → goal_met
│   ├── 체크인 임박 → ad_exp_banner_checkin_001 → goal_not_met
│   └── 기존 전체 → ad_exp_banner_all_001 → goal_met
└── SMS
    ├── 체크인 임박 → ad_exp_sms_checkin_001 → goal_not_met
    ├── 모바일 탐색 → ad_exp_sms_mobile_001 → goal_met
    ├── 가족 여행 → ad_exp_sms_family_001 → goal_near
    └── 기존 전체 → ad_exp_sms_all_001 → goal_met
```

워크플로우 페이지의 목적:

```text
1. 지금 어떤 단계가 실행 중인지 한눈에 보여준다.
2. 어떤 세그먼트가 실패했는지 보여준다.
3. 실패 세그먼트만 다음 루프를 돌고 있음을 보여준다.
4. 코치님이 지적한 “플로우가 잘 안 보인다” 문제를 해결한다.
```

---

### 1.8 설정 / SDK

역할:

```text
고객사가 프로젝트를 등록하고 SDK script를 발급받아 사이트에 삽입하는 흐름을 보여준다.
```

필수 표시:

```text
project_id
write_key 또는 sdk_key
domain
SDK script
도메인 연동 상태
최근 이벤트 수집 시간
수집 이벤트 목록
```

기본 SDK script:

```html
<script src="https://krafton-jungle-project-4team.github.io/loop-ad_event_sdk/loop-ad-event-sdk.iife.js" data-sdk-key="demo-shoppingmall" data-loop-ad-auto-track-page-views="true" data-loop-ad-collect-dom-events="true" async crossorigin="anonymous"></script>
```

주의:

```text
데모 repo public domain이 demo-shoppingmall이어도 화면과 이벤트는 호텔 예약 도메인으로 바꾼다.
SDK key 이름도 기존 구현과 호환을 위해 demo-shoppingmall을 유지할 수 있다.
```

---

## 2. 최종 도메인 객체

### 2.1 Campaign

```json
{
  "campaign_id": "camp_summer_2026",
  "project_id": "hotel-client-a",
  "name": "2026 여름 특가 세일",
  "objective": "기존 유저의 여름 숙박 예약 전환 증가",
  "target_audience": "existing_users",
  "start_date": "2026-07-15",
  "end_date": "2026-08-31",
  "primary_metric": "booking_conversion_rate",
  "status": "draft"
}
```

### 2.2 Promotion

```json
{
  "promotion_id": "promo_banner_001",
  "campaign_id": "camp_summer_2026",
  "channel": "onsite_banner",
  "marketing_theme": "summer_sale",
  "target_audience": "existing_users",
  "goal_metric": "booking_conversion_rate",
  "goal_target_value": 0.03,
  "goal_basis": "all_segments",
  "min_sample_size": 1000,
  "max_loop_count": 3,
  "message_brief": "여름 특가 숙소 예약을 유도한다.",
  "landing_url": "https://demo-stay.example.com/summer",
  "status": "draft"
}
```

### 2.3 Segment Definition

```json
{
  "segment_id": "seg_repeat_hotel_no_booking",
  "project_id": "hotel-client-a",
  "segment_name": "같은 숙소 반복 조회 후 미예약 고객",
  "source": "custom_chatkit",
  "natural_language_query": "최근 7일간 같은 hotel_cluster를 3회 이상 조회했고 booking_complete가 없는 사용자",
  "generated_sql": "...",
  "sample_size": 1342,
  "sample_ratio": 0.018,
  "status": "active"
}
```

### 2.4 Ad Experiment

```json
{
  "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "segment_id": "seg_repeat_hotel_no_booking",
  "content_id": "content_banner_repeat_hotel_001",
  "content_option_id": "banner_repeat_hotel_option_001",
  "goal_metric": "booking_conversion_rate",
  "goal_target_value": 0.03,
  "status": "running"
}
```

---

## 3. 목표 지표

### 3.1 inflow_rate

Email/SMS의 유입율이다.

```text
inflow_rate =
countDistinct(user_id where event_name = campaign_landing)
/
countDistinct(user_id where event_name = campaign_redirect_click)
```

### 3.2 booking_conversion_rate

내부 배너의 예약 전환율이다.

```text
booking_conversion_rate =
countDistinct(user_id where event_name = booking_complete)
/
countDistinct(user_id where event_name = promotion_click)
```

### 3.3 funnel_step_rate

퍼널 단계별 전환율이다.

```text
funnel_step_rate = next_step_user_count / previous_step_user_count
```

### 3.4 segment_sample_ratio

세그먼트 저장 가능 여부를 판단한다.

```text
segment_sample_ratio = segment_user_count / total_eligible_user_count
```

저장 가능 조건:

```text
segment_user_count >= max(100, total_eligible_user_count * 0.005)
```

---

## 4. 이벤트 규약

### 4.1 공통 envelope

```json
{
  "project_id": "hotel-client-a",
  "write_key": "public_write_key",
  "schema_version": "hotel_rec_promo.v1",
  "event_id": "evt_01HX0000000000000000000000",
  "event_name": "promotion_click",
  "event_time": "2026-07-02T12:00:00.000Z",
  "source": "browser_sdk",
  "user_id": "user_123",
  "session_id": "sess_456",
  "properties": {}
}
```

### 4.2 필수 event_name

```text
page_view
promotion_impression
promotion_click
campaign_redirect_click
campaign_landing
hotel_search
hotel_click
hotel_detail_view
booking_start
booking_complete
booking_cancel
```

선택:

```text
recommendation_request
recommendation_item_impression
```

### 4.3 프로모션 관련 필수 properties

```json
{
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001",
  "promotion_run_id": "run_banner_001",
  "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
  "promotion_channel": "onsite_banner",
  "segment_id": "seg_repeat_hotel_no_booking",
  "content_id": "content_banner_repeat_hotel_001",
  "content_option_id": "banner_repeat_hotel_option_001"
}
```

---

## 5. AI Decision API

Base path:

```text
/decision/v1
```

### 5.1 프로모션 분석 생성

```http
POST /decision/v1/promotions/{promotion_id}/analysis
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001",
  "focus_segment_ids": null,
  "operator_instruction": null
}
```

### 5.2 콘텐츠 생성

```http
POST /decision/v1/promotions/{promotion_id}/generation
```

### 5.3 promotion_run 및 ad_experiment 생성

```http
POST /decision/v1/promotions/{promotion_id}/runs
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "loop_count": 1,
  "ad_experiments": [
    {
      "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
      "segment_id": "seg_repeat_hotel_no_booking",
      "content_id": "content_banner_repeat_hotel_001",
      "content_option_id": "banner_repeat_hotel_option_001",
      "status": "planned"
    }
  ]
}
```

### 5.4 active contents 조회

```http
GET /decision/v1/promotion-runs/{promotion_run_id}/active-contents
```

### 5.5 segment-match

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/segment-match
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "user_id": "user_123",
  "matched_segment_id": "seg_repeat_hotel_no_booking",
  "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
  "content_id": "content_banner_repeat_hotel_001",
  "content_option_id": "banner_repeat_hotel_option_001",
  "similarity_score": 0.812,
  "fallback": false
}
```

### 5.6 ad_experiment 평가

```http
POST /decision/v1/ad-experiments/{ad_experiment_id}/evaluate
```

### 5.7 promotion_run 전체 평가

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/evaluate
```

### 5.8 next-loop 생성

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/next-loop
```

Request:

```json
{
  "failed_segment_ids": ["seg_repeat_hotel_no_booking"],
  "failed_ad_experiment_ids": ["ad_exp_banner_repeat_hotel_001"],
  "operator_instruction": "무료 취소보다 조식 포함과 당일 예약 가능성을 더 강조해줘."
}
```

---

## 6. 세그먼트 Query / ChatKit API

### 6.1 SQL Preview 생성

```http
POST /decision/v1/segments/query-preview
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "natural_language_query": "최근 7일간 같은 hotel_cluster를 3회 이상 조회했고 booking_complete가 없는 사용자",
  "base_time_range": {
    "from": "2026-07-01T00:00:00.000Z",
    "to": "2026-07-08T00:00:00.000Z"
  }
}
```

Response:

```json
{
  "query_preview_id": "seg_query_preview_001",
  "generated_sql": "WITH repeated_views AS (...) SELECT ... LIMIT 500",
  "sample_size": 1342,
  "sample_ratio": 0.018,
  "sample_size_status": "valid",
  "columns": ["user_id", "hotel_cluster", "detail_view_count", "last_view_at"],
  "rows": []
}
```

### 6.2 세그먼트 저장

```http
POST /decision/v1/segments
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "query_preview_id": "seg_query_preview_001",
  "segment_name": "같은 숙소 반복 조회 후 미예약 고객"
}
```

저장 규칙:

```text
sample_size_status = valid일 때만 저장 가능하다.
invalid이면 UI에서 sample이 너무 작다고 표시한다.
```

### 6.3 ChatKit Session

Dashboard API가 ChatKit session을 발급한다.

```http
POST /api/chatkit/v1/sessions
```

Response:

```json
{
  "client_secret": "...",
  "thread_id": "chat_thread_001"
}
```

ChatKit action은 Dashboard API가 받고, 필요한 경우 Decision API를 호출한다.

지원 action:

```text
query_segment
create_segment_definition
explain_segment_result
generate_content_for_segment
start_next_loop
explain_experiment_result
create_funnel_definition
```

Write성 action은 반드시 사용자 확인을 받는다.

```text
create_segment_definition
start_next_loop
generate_content_for_segment
create_funnel_definition
```

---

## 7. Dashboard 광고 실행 API

Base path:

```text
/api/ad/v1
```

### 7.1 배너 resolve

```http
GET /api/ad/v1/banner/resolve?project_id=hotel-client-a&promotion_run_id=run_banner_001&user_id=user_123&placement_id=home_top
```

처리:

```text
1. Decision active contents 조회
2. Decision segment-match 호출
3. ad_experiment_id 포함 content 반환
4. promotion_impression 이벤트 전송
```

### 7.2 redirect

```http
GET /r/{redirect_id}
```

처리:

```text
1. redirect_id 조회
2. user_id / campaign_id / promotion_id / promotion_run_id / ad_experiment_id 복원
3. campaign_redirect_click 이벤트 전송
4. target_url로 302 redirect
```

---

## 8. Data Source Contract DDL

Data Source Contract는 PostgreSQL / ClickHouse schema를 관리한다. 서비스 repo는 schema.sql을 만들지 않는다.

### 8.1 PostgreSQL 핵심 테이블

필수 테이블:

```text
projects
campaigns
promotions
promotion_analyses
promotion_target_segments
segment_vectors
generation_runs
content_candidates
promotion_runs
ad_experiments
promotion_evaluations
user_segment_assignments
segment_query_previews
segment_definitions
funnel_definitions
funnel_steps
ai_chat_sessions
ai_chat_messages
ai_action_runs
ad_dispatch_jobs
redirect_links
event_validation_errors
```

#### ad_experiments

```sql
CREATE TABLE IF NOT EXISTS ad_experiments (
    ad_experiment_id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100) NOT NULL,
    promotion_id VARCHAR(100) NOT NULL,
    promotion_run_id VARCHAR(100) NOT NULL,
    analysis_id VARCHAR(100) NOT NULL,
    generation_id VARCHAR(100) NOT NULL,
    segment_id VARCHAR(100) NOT NULL,
    segment_name VARCHAR(255),
    content_id VARCHAR(100) NOT NULL,
    content_option_id VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    loop_count INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    goal_metric VARCHAR(100) NOT NULL,
    goal_target_value NUMERIC(10, 6) NOT NULL,
    goal_basis VARCHAR(50) NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_ad_experiments_segment_per_run UNIQUE (promotion_run_id, segment_id)
);
```

#### segment_query_previews

```sql
CREATE TABLE IF NOT EXISTS segment_query_previews (
    query_preview_id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    created_by VARCHAR(100),
    natural_language_query TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    query_params_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_size INT NOT NULL DEFAULT 0,
    total_eligible_user_count INT NOT NULL DEFAULT 0,
    sample_ratio NUMERIC(10, 6) NOT NULL DEFAULT 0,
    sample_size_status VARCHAR(50) NOT NULL,
    result_columns_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    result_preview_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'previewed',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_segment_query_preview_status CHECK (status IN ('previewed', 'saved', 'rejected', 'failed')),
    CONSTRAINT chk_segment_query_preview_sample_status CHECK (sample_size_status IN ('valid', 'too_small', 'too_large', 'failed'))
);
```

#### segment_definitions

```sql
CREATE TABLE IF NOT EXISTS segment_definitions (
    segment_id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    segment_name VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    query_preview_id VARCHAR(100),
    natural_language_query TEXT,
    generated_sql TEXT,
    rule_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_size INT NOT NULL DEFAULT 0,
    sample_ratio NUMERIC(10, 6) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT chk_segment_definitions_source CHECK (source IN ('ai_suggested', 'custom_chatkit', 'manual_rule', 'system_default')),
    CONSTRAINT chk_segment_definitions_status CHECK (status IN ('active', 'archived'))
);
```

#### funnel_definitions / funnel_steps

```sql
CREATE TABLE IF NOT EXISTS funnel_definitions (
    funnel_id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    funnel_name VARCHAR(255) NOT NULL,
    domain_type VARCHAR(100) NOT NULL DEFAULT 'hotel_booking',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnel_steps (
    id BIGSERIAL PRIMARY KEY,
    funnel_id VARCHAR(100) NOT NULL,
    step_order INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    condition_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (funnel_id, step_order)
);
```

#### ChatKit tables

```sql
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    chat_session_id VARCHAR(100) PRIMARY KEY,
    project_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    chatkit_thread_id VARCHAR(255),
    context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_session_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_action_runs (
    action_run_id VARCHAR(100) PRIMARY KEY,
    chat_session_id VARCHAR(100),
    project_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_json JSONB,
    requires_confirmation BOOLEAN NOT NULL DEFAULT false,
    confirmed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### 8.2 ClickHouse 핵심 테이블/View

필수:

```text
raw_events
expedia_hotel_events
hotel_marketing_profiles
promotion_touch_events
booking_outcome_events
hotel_detail_events
funnel_step_events
user_behavior_vectors
event_validation_errors
```

`promotion_touch_events`, `booking_outcome_events`에는 반드시 `ad_experiment_id`가 있어야 한다.

#### hotel_detail_events View 예시

```sql
CREATE VIEW IF NOT EXISTS hotel_detail_events AS
SELECT
    event_time,
    project_id,
    user_id,
    session_id,
    JSONExtractString(properties_json, 'hotel_cluster') AS hotel_cluster,
    JSONExtractString(properties_json, 'hotel_market') AS hotel_market,
    properties_json
FROM raw_events
WHERE event_name = 'hotel_detail_view';
```

---

## 9. 레포별 PR 계획

아래 PR 계획은 팀원이 AI에게 그대로 넘겨도 작업 단위를 이해할 수 있게 작성한다.

중요:

```text
모든 repo 공통:
- .github 디렉터리는 삭제하지 않는다.
- 기존 workflow 파일은 삭제하지 않는다.
- 기존 env 이름은 rename하지 않는다.
- 필요하면 compatibility layer를 만들고, legacy shopping mall naming은 내부에서만 읽는다.
- 화면/API/public DTO는 호텔 도메인과 v1.5 최종 명칭으로 바꾼다.
```

---

## 9.1 loop-ad_context PR 계획

### PR C1. 공통 계약서 v1.5 반영

목표:

```text
모든 팀과 AI가 기준으로 삼을 최종 문서를 context repo에 반영한다.
```

작업:

```text
1. docs/ 또는 context/common/ 아래에 v1.5 문서 추가
2. v1.4 문서가 있으면 deprecated 표시
3. 최종 계층 Campaign → Promotion → Segment → Ad Experiment 명시
4. legacy → final 용어 매핑 추가
5. 사용 repo / 제외 repo registry 정리
```

완료 기준:

```text
팀원이 이 문서만 보고 각 repo 개발을 시작할 수 있다.
```

### PR C2. AI 개발 공통 프롬프트 추가

작업:

```text
1. prompts/common-development-rules.md 추가
2. 금지어: arm_id, bandit, Thompson Sampling, anomaly, root_cause, recommendation API
3. .github 보존 / env rename 금지 / schema.sql 중복 금지 문구 추가
4. ChatKit action은 write 작업 전 사용자 확인 필요 문구 추가
```

---

## 9.2 loop-ad_data-source_contract PR 계획

### PR D1. PostgreSQL 호텔 도메인 core schema 정리

목표:

```text
shopping mall 중심 schema를 호텔/숙박 도메인과 v1.5 계층으로 이관한다.
```

작업:

```text
1. projects/campaigns/promotions 정리
2. promotion_analyses 추가/정리
3. promotion_target_segments 추가/정리
4. generation_runs 추가/정리
5. content_candidates 추가/정리
6. promotion_runs 추가/정리
7. ad_experiments 추가
8. promotion_evaluations에 ad_experiment_id 추가
9. user_segment_assignments에 ad_experiment_id 추가
10. redirect_links에 ad_experiment_id 추가
11. ad_dispatch_jobs에 ad_experiment_id 추가
12. 기존 shopping/product 관련 테이블은 삭제하거나 legacy view로 격리
```

주의:

```text
- data-source contract repo만 schema.sql을 가진다.
- 다른 서비스 repo에 schema.sql을 만들지 않는다.
```

### PR D2. 세그먼트 SQL preview / custom segment schema 추가

작업:

```text
1. segment_query_previews 테이블 추가
2. segment_definitions 테이블 추가
3. sample size 관련 컬럼 추가
4. natural_language_query, generated_sql 저장
5. status enum valid/too_small/failed 관리
```

### PR D3. 퍼널 schema 추가

작업:

```text
1. funnel_definitions 추가
2. funnel_steps 추가
3. 기본 hotel_booking funnel seed 추가
   - page_view
   - hotel_search
   - hotel_click
   - hotel_detail_view
   - booking_start
   - booking_complete
```

### PR D4. ChatKit persistence schema 추가

작업:

```text
1. ai_chat_sessions 추가
2. ai_chat_messages 추가
3. ai_action_runs 추가
4. write action confirmation status 저장
```

### PR D5. ClickHouse hotel_rec_promo.v1 schema 정리

작업:

```text
1. raw_events 유지/정리
2. expedia_hotel_events 추가/정리
3. hotel_marketing_profiles view 추가/정리
4. promotion_touch_events에 ad_experiment_id 포함
5. booking_outcome_events에 ad_experiment_id 포함
6. hotel_detail_events view 추가
7. funnel_step_events view 또는 materialized view 추가
8. user_behavior_vectors 유지/정리
9. shopping mall event mapping view는 legacy로만 유지
```

### PR D6. 공통 seed/fixture를 호텔 도메인으로 교체

작업:

```text
1. Demo Stay project seed
2. camp_summer_2026 campaign seed
3. email/banner/sms promotions seed
4. 기본 segment_definitions seed
5. 기본 funnel_definitions seed
6. Expedia sample loading guide 정리
```

금지:

```text
쇼핑몰 product/cart/purchase seed를 최종 demo seed로 유지하지 않는다.
```

---

## 9.3 loop-ad_event_sdk PR 계획

### PR SDK1. hotel_rec_promo.v1 envelope mode 추가

작업:

```text
1. SDK init option에 project_id/write_key/schema_version/source 처리
2. 기존 data-sdk-key 속성 유지
3. 기존 data-loop-ad-auto-track-page-views 유지
4. 기존 data-loop-ad-collect-dom-events 유지
5. default schema_version = hotel_rec_promo.v1
6. legacy flat payload mode는 compatibility로만 유지
```

HTML script는 기존 형식을 유지한다.

```html
<script src="https://krafton-jungle-project-4team.github.io/loop-ad_event_sdk/loop-ad-event-sdk.iife.js" data-sdk-key="demo-shoppingmall" data-loop-ad-auto-track-page-views="true" data-loop-ad-collect-dom-events="true" async crossorigin="anonymous"></script>
```

### PR SDK2. 호텔 이벤트 helper 추가

추가 함수:

```text
trackPageView()
trackPromotionImpression()
trackPromotionClick()
trackCampaignLanding()
trackHotelSearch()
trackHotelClick()
trackHotelDetailView()
trackBookingStart()
trackBookingComplete()
trackBookingCancel()
```

각 helper는 공통 envelope와 properties를 만든다.

필수 properties:

```text
campaign_id
promotion_id
promotion_run_id
ad_experiment_id
segment_id
content_id
content_option_id
promotion_channel
```

### PR SDK3. DOM 자동 수집을 호텔 이벤트로 변환

작업:

```text
1. data-loop-ad-event-name 속성 지원
2. data-loop-ad-hotel-cluster 속성 지원
3. data-loop-ad-promotion-id 지원
4. data-loop-ad-ad-experiment-id 지원
5. 기존 product/cart 속성은 legacy로만 처리
```

### PR SDK4. 테스트/README 갱신

작업:

```text
1. hotel_rec_promo.v1 event unit test
2. SDK script guide 업데이트
3. shopping mall 예시는 legacy section으로 이동
```

---

## 9.4 loop-ad_event_collector PR 계획

### PR EC1. envelope validation 추가

작업:

```text
1. schema_version 필수 검증
2. write_key 필수 검증
3. source = browser_sdk | redirect 검증
4. user_id 필수 검증
5. properties object 검증
6. event_name enum 검증
```

### PR EC2. 프로모션 이벤트 필수 properties 검증

프로모션 관련 이벤트:

```text
promotion_impression
promotion_click
campaign_redirect_click
campaign_landing
booking_complete
```

필수 검증:

```text
campaign_id
promotion_id
promotion_run_id
ad_experiment_id
segment_id
content_id
content_option_id
promotion_channel
```

단, `booking_complete`는 자연 유입 예약도 있을 수 있으므로 campaign_id가 없는 이벤트를 허용할지 정책을 분리한다.

```text
MVP 프로모션 평가용 booking_complete는 반드시 promotion_run_id/ad_experiment_id를 가진다.
일반 booking_complete는 raw_events에는 저장하되 promotion 평가에는 사용하지 않는다.
```

### PR EC3. Kafka raw publish 유지

작업:

```text
1. 기존 LOOPAD_KAFKA_* env 유지
2. 기존 LOOPAD_EVENT_TOPIC 유지
3. Collector가 ClickHouse 직접 적재 책임을 새로 갖지 않음
4. validation_status를 payload에 포함하거나 validation error topic/DB로 분리
```

### PR EC4. validation error 저장 연동

작업:

```text
1. event_validation_errors에 적재하는 repository 추가
2. error_code 표준화
3. Dashboard 이벤트 모니터에서 조회 가능한 구조로 저장
```

---

## 9.5 loop-ad_decision PR 계획

### PR DEC1. v1.5 DTO / Enum / Router 추가

추가 enum:

```text
Channel: email | sms | onsite_banner
GoalMetric: inflow_rate | booking_conversion_rate | funnel_step_rate
GoalBasis: promotion_average | all_segments
AdExperimentStatus
SegmentSource
QueryPreviewStatus
```

추가 router:

```text
/decision/v1/promotions/{promotion_id}/analysis
/decision/v1/promotions/{promotion_id}/generation
/decision/v1/promotions/{promotion_id}/runs
/decision/v1/promotion-runs/{promotion_run_id}/active-contents
/decision/v1/promotion-runs/{promotion_run_id}/segment-match
/decision/v1/ad-experiments/{ad_experiment_id}/evaluate
/decision/v1/promotion-runs/{promotion_run_id}/evaluate
/decision/v1/promotion-runs/{promotion_run_id}/next-loop
/decision/v1/segments/query-preview
/decision/v1/segments
```

주의:

```text
기존 /internal/jobs/daily-decision/run이 있으면 바로 삭제하지 않는다.
final API facade를 먼저 추가한다.
public 응답에서 anomaly/root_cause/recommendation 단어를 제거한다.
```

### PR DEC2. 자연어 → SQL Query Preview 기능

작업:

```text
1. SegmentQueryService 추가
2. NaturalLanguageToSqlPromptBuilder 추가
3. SQL Safety Validator 추가
4. ClickHouse read-only query executor 추가
5. segment_query_previews 저장
6. sample size 계산
7. 결과 table preview 반환
```

SQL safety:

```text
SELECT/WITH만 허용
project_id 조건 필수
LIMIT 필수
DDL/DML 금지
timeout 10초
max preview rows 500
```

### PR DEC3. 사용자 정의 세그먼트 저장

작업:

```text
1. POST /decision/v1/segments 구현
2. query_preview_id 조회
3. sample_size_status valid 확인
4. segment_definitions 저장
5. segment_vector 생성 요청 또는 lazy 생성 처리
```

### PR DEC4. 프로모션 분석 기능 호텔 도메인화

작업:

```text
1. promotion goal 조회
2. segment_definitions와 기본 세그먼트 조회
3. Expedia/hotel event profile 조회
4. 프로모션별 target_segment 생성
5. content_brief_json 생성
6. promotion_analyses / promotion_target_segments 저장
```

AI 제안 세그먼트 예시:

```text
seg_near_checkin
seg_repeat_hotel_no_booking
seg_family_trip
seg_mobile_user
```

### PR DEC5. 콘텐츠 생성 + 생성 이유 리포트

작업:

```text
1. content_candidates 생성
2. generation_runs 저장
3. 생성 이유 report 생성
4. data_evidence 포함
5. SQL/query_preview reference 포함
6. channel별 필드 생성
```

채널별 필드:

```text
email: subject, preheader, body, cta
sms: message
onsite_banner: title, body, cta, image_prompt
```

### PR DEC6. ad_experiment 생성

작업:

```text
1. promotion_run 생성
2. segment별 승인 content 1개 확인
3. segment별 ad_experiment 1개 생성
4. UNIQUE(promotion_run_id, segment_id) 위반 방지
5. active contents 응답에 ad_experiment_id 포함
```

### PR DEC7. 64차원 segment-match

작업:

```text
1. user_behavior_vectors 조회
2. segment_vectors 조회
3. cosine similarity 계산
4. threshold 0.65 미만이면 fallback segment
5. user_segment_assignments 저장
6. 응답에 ad_experiment_id/content_id/content_option_id 포함
```

### PR DEC8. 평가와 next-loop

작업:

```text
1. ad_experiment_id 기준 지표 계산
2. inflow_rate / booking_conversion_rate 계산
3. min_sample_size 검증
4. ad_experiment evaluation 저장
5. promotion_run aggregate status 계산
6. failed_segment_ids / failed_ad_experiment_ids 산출
7. next-loop에서 실패 세그먼트만 analysis/generation/run 생성
8. operator_instruction optional 반영
```

### PR DEC9. ChatKit action backend

작업:

```text
1. Chat action handler 추가
2. query_segment action → query-preview 호출
3. create_segment_definition action → 확인 후 segment 저장
4. generate_content_for_segment action → generation 호출
5. start_next_loop action → 확인 후 next-loop 호출
6. explain_experiment_result action → evaluation 요약
7. ai_chat_sessions/messages/action_runs 저장
```

주의:

```text
ChatKit UI는 Dashboard Web이 담당한다.
Decision API는 tool/action 실행만 제공한다.
OpenAI API key는 FE에 노출하지 않는다.
```

---

## 9.6 loop-ad_dashboard PR 계획

### PR DASH1. 호텔 도메인 shared types / API client 정리

작업:

```text
1. Campaign/Promotion/Segment/AdExperiment 타입 추가
2. ContentCandidate 타입 추가
3. SegmentQueryPreview 타입 추가
4. FunnelDefinition 타입 추가
5. 기존 product/cart/purchase 타입 제거 또는 legacy 격리
6. Decision API client 추가
7. Collector/Dashboard API client 정리
```

### PR DASH2. 메인 대시보드 / 마케팅 기획서 유지 및 호텔화

작업:

```text
1. 기존 새로 만든 메인 대시보드 유지
2. 캠페인 목록 표시
3. 새 캠페인 생성 버튼
4. 마케팅 기획서 페이지 유지
5. 프로모션 channel을 email/sms/onsite_banner로 고정
6. shopping mall 문구 제거
```

### PR DASH3. 실시간 추이 페이지 추가

작업:

```text
1. 실시간 이벤트 추이 chart
2. 피크타임 행동 이벤트 표시
3. 실시간 booking_complete count 표시
4. event_name/channel/promotion 필터
5. ClickHouse query API 연동 또는 mock → 실제 순서로 구현
```

### PR DASH4. 퍼널 페이지 추가

작업:

```text
1. 기본 호텔 퍼널 시각화
2. funnel_definitions 조회
3. funnel_steps 조회
4. 단계별 전환율 표시
5. 퍼널 단계 편집 UI optional
6. 병목 단계 강조
```

### PR DASH5. 세그먼트 페이지 추가

작업:

```text
1. AI 추천 세그먼트 표시
2. 자연어 입력창
3. “SQL 생성” 버튼
4. 생성 SQL preview 표시
5. 결과 테이블 표시
6. sample size / sample ratio 표시
7. “세그먼트 저장” 버튼
8. 저장 불가 조건이면 버튼 비활성화
```

### PR DASH6. ChatKit 챗봇 UI 추가

작업:

```text
1. ChatKit embed 영역 추가
2. /api/chatkit/v1/sessions 호출
3. query_segment action 버튼/응답 표시
4. create_segment_definition 확인 UI
5. start_next_loop 확인 UI
6. ChatKit에서 생성한 세그먼트를 페이지 UI와 동기화
```

주의:

```text
OpenAI key를 FE env에 넣지 않는다.
FE는 client_secret만 받는다.
```

### PR DASH7. AI 생성 페이지 리포트 보강

작업:

```text
1. 세그먼트별 콘텐츠 카드 클릭 preview 유지
2. 생성 이유 리포트 추가
3. data_evidence 표시
4. generated_sql/query_preview reference 표시
5. 생성 콘텐츠 승인/거절 버튼
6. 세그먼트별 승인 콘텐츠 1개만 선택 가능
```

### PR DASH8. 워크플로우 DAG 페이지 추가

작업:

```text
1. Campaign node
2. Promotion node
3. Segment node
4. Ad Experiment node
5. Evaluation node
6. Next-loop node
7. 상태별 색상
8. 실패 세그먼트에서 next-loop 연결선 표시
```

### PR DASH9. 종료 후 결과 / 재실험 흐름 수정

작업:

```text
1. 프로모션별 4개 세그먼트 결과 표시
2. goal_basis 기준 설명 표시
3. 목표 미달 세그먼트 선택
4. operator_instruction optional 입력
5. next-loop 호출
6. AI 생성 탭에는 재실험 대상 세그먼트 1개만 표시
7. 업로드/실험 탭에도 새 ad_experiment 1개만 표시
```

### PR DASH10. Dashboard API 광고 실행 모듈

작업:

```text
1. GET /api/ad/v1/banner/resolve
2. POST /api/ad/v1/promotion-runs/{promotion_run_id}/dispatch
3. GET /r/{redirect_id}
4. active contents 조회
5. segment-match 호출
6. 이벤트 collector로 promotion_impression/promotion_click/campaign_redirect_click 전송
7. redirect_links 생성
```

---

## 9.7 loop-ad_advertisement_sdk PR 계획

### PR ADSDK1. final 광고 필드 적용

작업:

```text
experimentId → promotionRunId/adExperimentId
variantId → contentOptionId
creativeId → contentId
ad_impression → promotion_impression
ad_click → promotion_click
```

### PR ADSDK2. Dashboard banner resolve 연동

작업:

```text
1. Dashboard API /api/ad/v1/banner/resolve 호출
2. 응답의 ad_experiment_id/segment_id/content_id/content_option_id 저장
3. 노출 시 promotion_impression 전송
4. 클릭 시 promotion_click 전송
```

---

## 9.8 loop-ad_demo-shoppingmall_front PR 계획

### PR DEMO1. 쇼핑몰 화면을 호텔 예약 데모로 교체

작업:

```text
1. repo 이름은 그대로 둔다.
2. .github는 삭제하지 않는다.
3. 기존 배포 workflow는 유지한다.
4. 화면은 Demo Stay 호텔 예약 사이트로 변경한다.
5. 상품 목록 → 숙소 목록
6. 상품 상세 → 숙소 상세
7. 구매 완료 → 예약 완료
```

이벤트 매핑:

```text
product_view → hotel_detail_view
product_click → hotel_click
purchase_success → booking_complete
ad_impression → promotion_impression
ad_click → promotion_click
```

### PR DEMO2. 호텔 행동 이벤트 삽입

작업:

```text
1. hotel_search 이벤트 발생
2. hotel_click 이벤트 발생
3. hotel_detail_view 이벤트 발생
4. booking_start 이벤트 발생
5. booking_complete 이벤트 발생
6. promotion 관련 이벤트에 ad_experiment_id 포함
```

### PR DEMO3. 재실험 시나리오용 fixture 추가

작업:

```text
1. 체크인 임박 사용자 fixture
2. 반복 숙소 조회 후 미예약 사용자 fixture
3. 예약 완료 사용자 fixture
4. 재실험 광고 클릭 flow fixture
```

---

## 9.9 loop-ad_infra PR 계획

### PR INFRA1. app repository guide 기준 확인

작업:

```text
1. 서비스 이름 유지
   - event-collector
   - dashboard-api
   - decision-api
2. advertisement-api를 새로 추가하지 않음
3. PORT/health/internal key 계약 유지
4. 기존 env 주입 이름 유지
5. FE에 secret env가 들어가지 않도록 확인
```

### PR INFRA2. 신규 API path routing 점검

작업:

```text
1. decision.api.dev.loop-ad.org에서 /decision/v1/* 접근 가능 확인
2. dashboard.api.dev.loop-ad.org에서 /api/ad/v1/* 접근 가능 확인
3. event.api.dev.loop-ad.org에서 /collect/v1/* 접근 가능 확인
4. /internal/* X-Loop-Ad-Internal-Key 검증 유지
```

주의:

```text
앱 기능 PR보다 인프라 PR을 먼저 크게 열지 않는다.
앱 repo가 final endpoint를 구현한 뒤 routing만 맞춘다.
```

---

## 9.10 제외 repo

### loop-ad_local-data-source_contract

```text
신규 구현 대상에서 제외한다.
loop-ad_data-source_contract가 공식 Data Source Contract다.
README나 문서에 남아 있는 참조만 제거한다.
```

### loop-ad_advertisement

```text
신규 구현 대상에서 제외한다.
별도 advertisement-api는 만들지 않는다.
광고 실행은 Dashboard API 서버 내부 모듈로 구현한다.
```

---

## 10. 최종 PR 실행 순서

가장 안전한 순서:

```text
1. loop-ad_context
   - v1.5 문서와 공통 프롬프트 반영

2. loop-ad_data-source_contract
   - PostgreSQL/ClickHouse final schema 추가
   - hotel seed/funnel/segment table 추가

3. loop-ad_event_sdk + loop-ad_event_collector
   - hotel_rec_promo.v1 수집 계약 적용

4. loop-ad_decision
   - /decision/v1 API
   - segment query preview
   - custom segment
   - generation report
   - ad_experiment evaluation/next-loop
   - ChatKit action backend

5. loop-ad_dashboard
   - 7개 페이지 구현
   - ChatKit UI
   - Dashboard 광고 실행 모듈

6. loop-ad_advertisement_sdk
   - banner resolve / final event field 적용

7. loop-ad_demo-shoppingmall_front
   - 호텔 예약 데모로 화면/이벤트 교체

8. loop-ad_infra
   - routing/env/health 최종 확인
```

---

## 11. 최종 체크리스트

```text
[ ] .github 디렉터리를 삭제하지 않았는가?
[ ] 기존 workflow 파일을 삭제하지 않았는가?
[ ] 기존 env 이름을 rename하지 않았는가?
[ ] 서버는 PORT env로 0.0.0.0:${PORT} listen하는가?
[ ] 서버는 /health 200을 반환하는가?
[ ] FE bundle에 secret/OpenAI key/DB credential이 들어가지 않는가?
[ ] shopping mall public 문구가 호텔 예약 도메인으로 바뀌었는가?
[ ] Campaign → Promotion → Segment → Ad Experiment 계층을 지켰는가?
[ ] 같은 promotion_run_id + segment_id에 ad_experiment가 1개만 생기는가?
[ ] 모든 프로모션 이벤트에 ad_experiment_id가 포함되는가?
[ ] 세그먼트 페이지에서 자연어 → SQL → table preview가 가능한가?
[ ] SQL은 SELECT/WITH만 허용되는가?
[ ] sample size 기준을 통과해야 세그먼트 저장이 가능한가?
[ ] ChatKit write action은 사용자 확인 후 실행되는가?
[ ] AI 생성 페이지에 생성 이유/근거 리포트가 있는가?
[ ] 워크플로우 페이지에서 현재 루프 상태가 DAG로 보이는가?
[ ] 목표 미달 세그먼트만 next-loop 대상이 되는가?
```

---

## 12. AI에게 개발 지시할 때 공통 프롬프트

```text
이 프로젝트는 호텔/숙박 예약 도메인의 목표 기반 마케팅 자동화 솔루션이다.
최종 계층은 Campaign → Promotion → Segment → Ad Experiment다.
MVP에서는 같은 promotion_run_id 안에서 segment_id당 ad_experiment_id는 1개만 존재한다.
현재 repo에 shopping mall/product/cart/purchase 구현이 있으면 호텔 도메인으로 이관한다.
단, .github 디렉터리와 기존 GitHub Actions workflow는 삭제하지 않는다.
기존 환경변수 이름은 rename하지 않는다.
필수 env fallback/default를 추가하지 않는다.
DB schema.sql은 loop-ad_data-source_contract만 관리한다.
서비스 repo에는 schema.sql을 새로 만들지 않는다.
추천 API, 이상징후 탐지, root cause, arm_id, bandit, Thompson Sampling은 구현하지 않는다.
세그먼트 페이지에는 자연어 → SQL preview → 결과 테이블 → sample size 검증 → 세그먼트 저장 흐름을 구현한다.
ChatKit 챗봇은 Dashboard 안에서 세그먼트 조회/생성, 콘텐츠 생성, 재실험 시작을 도와야 하며 write성 action은 사용자 확인 후 실행한다.
```


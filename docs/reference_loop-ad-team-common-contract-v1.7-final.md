# Loop-Ad Team Common Contract v1.7 Final Reference

이 문서는 Loop-Ad 팀 공통 구현 계약의 최종 reference다. 원본 계약서들은 아래 파일에
보존한다.

- `docs/reference_loop-ad-team-common-contract-v1.4-original.md`
- `docs/reference_loop-ad-team-common-contract-v1.5-original.md`
- `docs/reference_loop-ad-team-common-contract-v1.6-original.md`

이 문서는 버전별 이력 설명, 개별 작업 실행 지시, 개발 요청 문구를 제외하고 최종 구현
계약만 정리한다.

## 0. 범위

대상 팀:

```text
Dashboard
Dashboard 광고 실행 모듈
AI Decision
수집/SDK
Data Source Contract
Demo Front
Infra
```

기준 도메인:

```text
호텔/숙박 예약
```

최종 목표:

```text
기존 쇼핑몰/상품/구매/추천/실험 중심 구현을 호텔 예약 도메인과 이 계약으로 이관한다.
필요하면 기존 앱 코드는 재작성할 수 있다.
.github 디렉터리, 기존 GitHub Actions workflow, 기존 환경변수 이름은 유지한다.
```

## 1. 최상위 원칙

### 1.1 사용자-facing 계층

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
4. 같은 promotion_run 안에서 segment_id당 ad_experiment_id는 1개만 존재한다.
5. 목표 미달 시 성공 세그먼트는 유지하고, 실패 세그먼트만 다시 분석 → 생성 → 실험한다.
6. 한 ad_experiment는 MVP에서 하나의 승인 콘텐츠만 사용한다.
```

### 1.2 서비스 책임 경계

```text
Decision = 계산/분석/생성/매칭/평가 결과를 DB에 저장하는 엔진
Dashboard = 사용자 UI, ChatKit, 세그먼트 쿼리, 광고 실행, DB 조회 담당
Collector/SDK = 이벤트 수집 담당
Data Source Contract = PostgreSQL/ClickHouse schema 담당
Infra = 배포, 도메인, 라우팅, 공통 운영 규칙 담당
```

Dashboard와 Decision의 API 통신은 생명주기 이벤트에만 사용한다.

```text
프로모션 분석 요청
콘텐츠 생성 요청
promotion_run / ad_experiment 생성 요청
세그먼트 매칭 배치 생성 요청
평가 / next-loop 생성 요청
```

아래 hot path에서는 Decision API를 호출하지 않는다.

```text
배너 resolve
email/sms 발송 대상 조회
redirect 처리
대시보드 단순 조회
ChatKit 세그먼트 쿼리 preview
사용자 정의 세그먼트 저장
```

### 1.3 쇼핑몰 구현 이관 규칙

쇼핑몰 기준 개념은 호텔 예약 도메인으로 이관한다.

| 기존 개념 | 최종 개념 |
|---|---|
| `product_id` | `hotel_id` 또는 `hotel_cluster` |
| `product_view` | `hotel_detail_view` |
| `product_click` | `hotel_click` |
| `add_to_cart` | 사용하지 않음. 필요 시 `booking_start`로 매핑 |
| `checkout_start` | `booking_start` |
| `purchase`, `purchase_success` | `booking_complete` |
| `ad_impression` | `promotion_impression` |
| `ad_click` | `promotion_click` |
| `conversion_rate` | `booking_conversion_rate` 또는 `inflow_rate` |
| `cart_abandoner` | `hotel_detail_no_booking` 또는 `booking_start_no_complete` |

허용:

```text
기존 쇼핑몰 코드를 호텔 도메인으로 재작성할 수 있다.
기존 env 이름은 rename하지 않고 유지한다.
신규 env가 필요하면 추가한다.
```

금지:

```text
.github 삭제
기존 deploy workflow 삭제
기존 env 이름 변경
앱 코드에서 필수 env fallback/default 추가
DB schema.sql을 서비스 repo에 중복 생성
secret/API key를 FE bundle, 로그, metric label, plain GitHub Actions env에 노출
```

### 1.4 인프라/배포 계약

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

공통 env 이름:

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
필요하면 compatibility function에서 두 env를 모두 읽는다.
레포 내부 public contract는 기존 이름을 유지한다.
```

Dev 인프라 대상 서버:

```text
event-collector
dashboard-api
decision-api
```

`advertisement-api`는 별도 dev 인프라 대상이 아니다. 광고 실행 기능은 Dashboard API 서버
내부 모듈로 구현한다.

Public API domain:

```text
Event Collector: https://event.api.dev.loop-ad.org
Dashboard API:  https://dashboard.api.dev.loop-ad.org
Decision API:   https://decision.api.dev.loop-ad.org
```

Frontend 정적 사이트:

```text
Dashboard Web:          https://dashboard.dev.loop-ad.org
Demo shoppingmall Web:  https://demo-shoppingmall.dev.loop-ad.org
```

데모 repo 이름과 public domain은 `demo-shoppingmall`을 유지할 수 있지만, 화면/도메인/이벤트
내용은 호텔 예약 데모로 제공한다.

## 2. 사용자 시나리오와 Dashboard 화면 구조

### 2.1 고객 페르소나

```text
고객사:
빠르게 성장 중인 숙박 예약 플랫폼

상황:
별도 마케팅 부서가 없어 여름 특가 세일을 자동화하고 싶다.

관리자:
숙박 예약 플랫폼의 기획자

관리자가 하고 싶은 일:
기존 유저 대상으로 여름 특가 세일 캠페인을 만들고,
Email / 내부 배너 / SMS 프로모션을 운영해 목표 지표를 달성하고 싶다.
```

### 2.2 Dashboard 화면 계층

Dashboard Web은 프로젝트를 최상위 작업 공간으로 두고, 캠페인/프로모션/세그먼트를 아래
구조로 탐색한다.

```text
프로젝트
└── 캠페인 목록
    └── 캠페인 상세
        ├── 마케팅 기획
        ├── 실시간 추이
        │   ├── 지표
        │   ├── 집계
        │   └── 프로모션 집계
        ├── 워크플로우 View
        └── 프로모션 목록
            └── 프로모션 상세
                ├── 세그먼트 목록
                │   └── 세그먼트 상세
                │       ├── 세그먼트 추가
                │       ├── 세그먼트 변경
                │       ├── 세그먼트 삭제
                │       └── 실시간 추이
                │           ├── 지표
                │           ├── 집계
                │           ├── 퍼널
                │           ├── SMS/Email 발송 상태
                │           └── 배너 조회/클릭률
                └── 실시간 추이
                    ├── 지표
                    ├── 집계
                    ├── 퍼널
                    └── 세그먼트 집계
```

추가 유틸리티 화면:

```text
설정 / SDK
```

### 2.3 프로젝트와 캠페인 목록

역할:

```text
현재 프로젝트의 캠페인 목록과 전체 상태를 보여준다.
새 캠페인을 만들거나 기존 캠페인 상세로 들어간다.
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

캠페인 카드 또는 행 구성:

```text
campaign_id
campaign_name
objective
status
start_date
end_date
promotion_count
segment_count
ad_experiment_count
current_goal_achievement_rate
next_action
```

필수 동선:

```text
1. 캠페인 생성
2. 캠페인 검색/필터
3. 캠페인 상세 진입
4. 캠페인 상태 확인
```

### 2.4 캠페인 상세

역할:

```text
하나의 캠페인 안에서 마케팅 기획, 실시간 추이, 워크플로우, 프로모션 목록을 함께 관리한다.
```

필수 구성:

```text
캠페인 요약
마케팅 기획
실시간 추이
워크플로우 View
프로모션 목록
다음 액션
```

캠페인 요약 표시:

```text
campaign_id
campaign_name
objective
target_audience
status
start_date
end_date
max_loop_count
current_loop_count
promotion_count
segment_count
ad_experiment_count
current_goal_achievement_rate
next_action
```

### 2.5 마케팅 기획

역할:

```text
관리자가 캠페인과 하위 프로모션을 생성하고, 프로모션별 메시지 방향을 검토한다.
```

캠페인 입력:

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
message_brief optional
offer_type
landing_url
```

기본 프로모션:

| promotion | channel | target | goal_metric | target_value | goal_basis |
|---|---|---|---|---:|---|
| 프로모션 1 | email | existing_users | inflow_rate | 0.10 | promotion_average |
| 프로모션 2 | onsite_banner | existing_users | booking_conversion_rate | 0.03 | all_segments |
| 프로모션 3 | sms | existing_users | inflow_rate | 0.08 | all_segments |

프로모션/세그먼트별 생성 콘텐츠 표시:

```text
1. 생성 콘텐츠 카드
2. 세그먼트별 생성 이유
3. 데이터 근거
4. 사용한 세그먼트 조건 요약
5. 생성 메시지 방향
6. 선택한 호텔 도메인 근거
7. 예상 효과
8. 관리자가 승인/거절/재생성할 수 있는 버튼
```

생성 리포트 구성:

```text
segment_id
segment_name
reason_summary
data_evidence
message_strategy
content_candidates
```

### 2.6 캠페인 실시간 추이

역할:

```text
캠페인 단위의 피크타임 행동 이벤트와 실시간 예약 추이를 보여준다.
호텔 도메인 이벤트를 기준으로 표시한다.
```

필수 하위 구성:

```text
1. 지표
2. 집계
3. 프로모션 집계
```

지표 구성:

```text
최근 5분/1시간 이벤트 수
캠페인 랜딩 수
프로모션 노출 수
프로모션 클릭 수
예약 시작 수
예약 완료 수
목표 달성률
피크타임
```

집계 구성:

```text
이벤트 종류별 추이
channel별 추이
time_range별 추이
hotel_search → hotel_click → booking_complete 실시간 count
```

프로모션 집계 구성:

```text
promotion_id별 클릭/랜딩/예약 추이
promotion_id별 goal_metric
promotion_id별 goal_target_value
promotion_id별 current_goal_achievement_rate
promotion_id별 next_action
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
프로젝트
캠페인
프로모션
채널
세그먼트
이벤트 종류
기간
```

### 2.7 워크플로우 View

역할:

```text
캠페인 상세 안에서 Campaign → Promotion → Segment → Ad Experiment 구조와 현재 진행 상태를 보여준다.
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
goal_near
insufficient_data
next_loop_created
stopped
```

목적:

```text
1. 어떤 단계가 실행 중인지 보여준다.
2. 어떤 세그먼트가 실패했는지 보여준다.
3. 실패 세그먼트만 다음 루프를 도는 구조를 보여준다.
4. 캠페인부터 광고 실험까지의 흐름을 한 화면에서 설명한다.
```

### 2.8 프로모션 목록

역할:

```text
캠페인 상세 안에서 캠페인에 속한 프로모션을 목록으로 보여준다.
프로모션 상세 또는 세그먼트 상세로 들어가는 시작점이다.
```

필수 구성:

```text
프로모션 목록
프로모션 검색/필터
프로모션 생성
프로모션 상태
프로모션별 세그먼트 요약
프로모션 상세 진입
세그먼트 상세 진입
```

프로모션 행 구성:

```text
promotion_id
promotion_name
channel
status
start_date
end_date
goal_metric
goal_target_value
goal_basis
segment_count
ad_experiment_count
current_goal_achievement_rate
next_action
```

### 2.9 프로모션 상세

역할:

```text
하나의 프로모션에 대한 기본 정보, 세그먼트 목록, 실시간 추이, 퍼널, 세그먼트 집계를 보여준다.
```

필수 구성:

```text
프로모션 요약
세그먼트 목록
실시간 추이
다음 액션
```

세그먼트 탭 관리:

```text
프로모션 상세는 여러 세그먼트를 탭 형태의 작업 단위로 열어 관리할 수 있다.
각 세그먼트 탭은 세그먼트 요약, 실시간 지표, 집계, 퍼널, 발송 상태, 배너 조회/클릭률을 함께 보여준다.
관리자는 프로모션 전체 지표와 세그먼트별 지표를 오가며 비교한다.
```

프로모션 요약 표시:

```text
promotion_id
promotion_name
campaign_id
channel
marketing_theme
target_audience
status
goal_metric
goal_target_value
goal_basis
offer_type
landing_url
segment_count
ad_experiment_count
current_goal_achievement_rate
next_action
```

실시간 추이 하위 구성:

```text
1. 지표
2. 집계
3. 퍼널
4. 세그먼트 집계
```

지표 구성:

```text
프로모션 노출 수
프로모션 클릭 수
캠페인 리다이렉트 클릭 수
캠페인 랜딩 수
예약 시작 수
예약 완료 수
목표 달성률
```

집계 구성:

```text
time_range별 추이
channel별 추이
landing_type별 추이
이벤트 종류별 추이
```

세그먼트 집계 구성:

```text
segment_id
segment_name
segment_user_count
delivery_count
reach_count
click_count
booking_start_count
booking_complete_count
goal_metric
current_goal_achievement_rate
status
next_action
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
Email/SMS:
campaign_redirect_click
→ campaign_landing

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
1. 퍼널 생성
2. 퍼널 단계 순서 설정
3. 이벤트 종류 매핑
4. 페이지 조건 optional 설정
5. 프로모션/채널별 퍼널 저장
```

숙박 사이트마다 퍼널 이벤트가 다를 수 있으므로 퍼널은 고정된 단일 구성으로 취급하지
않는다. 기본 호텔 퍼널 예시를 제공하되 Dashboard에서 수정 가능해야 한다.

### 2.10 세그먼트 목록과 세그먼트 상세

역할:

```text
프로모션 상세 안에서 세그먼트 목록을 보여주고,
각 세그먼트의 조건, 대상 규모, 생성 콘텐츠, 실시간 추이를 확인한다.
```

세그먼트 목록 구성:

```text
AI 추천 세그먼트 목록
사용자 정의 세그먼트 목록
세그먼트 검색/필터
세그먼트 추가
세그먼트 상세 진입
```

세그먼트 행 구성:

```text
segment_id
segment_name
source = ai_recommended | user_defined
status
segment_user_count
goal_metric
current_goal_achievement_rate
ad_experiment_id
next_action
```

세그먼트 상세 구성:

```text
세그먼트 요약
세그먼트 조건 요약
대상 규모
sample size 검증
연결된 ad_experiment
생성 콘텐츠 카드
세그먼트별 생성 이유
데이터 근거
생성 메시지 방향
예상 효과
실시간 추이
세그먼트 추가/변경/삭제
```

세그먼트 조회/정의 방식:

```text
1. AI 추천 세그먼트 확인
2. 자연어 세그먼트 조회
3. 조건 미리보기
4. 결과 테이블 확인
5. sample size 검증
6. 사용자 정의 세그먼트 저장
7. 챗봇으로 세그먼트 생성/조회
```

자연어 예시:

```text
최근 7일간 같은 hotel_cluster를 3회 이상 조회했고 booking_complete가 없는 사용자 찾아줘.
서울 지역 호텔을 2회 이상 클릭했지만 예약하지 않은 기존 사용자 보여줘.
체크인까지 7일 이하인데 아직 예약 완료가 없는 사용자를 세그먼트로 만들고 싶어.
```

세그먼트 저장 가능 조건:

```text
segment_user_count >= max(100, total_eligible_user_count * 0.005)
```

기본값:

```text
최소 세그먼트 사용자 수 = 100
최소 세그먼트 비율 = 0.5%
최대 미리보기 행 수 = 500
미리보기 제한 시간 = 10초
```

세그먼트 추가 구성:

```text
segment_name
segment_description
target_condition
sample size preview
저장 확인
```

세그먼트 변경 구성:

```text
기존 segment summary
변경할 target_condition
변경 전/후 대상 규모 비교
변경 저장 확인
```

세그먼트 삭제 구성:

```text
삭제 대상 segment summary
연결된 ad_experiment 표시
진행 중 프로모션 영향 표시
삭제 확인
```

### 2.11 세그먼트 실시간 추이

역할:

```text
세그먼트 상세 안에서 해당 세그먼트의 지표, 집계, 퍼널, 발송 상태, 배너 반응을 보여준다.
```

필수 하위 구성:

```text
1. 지표
2. 집계
3. 퍼널
4. SMS/Email 발송 상태
5. 배너 조회/클릭률
```

지표 구성:

```text
segment_user_count
delivery_count
reach_count
promotion_impression_count
promotion_click_count
campaign_redirect_click_count
campaign_landing_count
booking_start_count
booking_complete_count
goal_metric
current_goal_achievement_rate
```

집계 구성:

```text
time_range별 추이
이벤트 종류별 추이
channel별 추이
hotel_cluster별 추이
landing_type별 추이
```

퍼널 구성:

```text
Email/SMS 발송 → 도달 → 클릭 → 랜딩 → 예약 시작 → 예약 완료
Onsite banner 노출 → 클릭 → 호텔 조회 또는 상세 조회 → 예약 완료
```

SMS/Email 발송 상태 구성:

```text
scheduled_count
sent_count
delivered_count
opened_count
clicked_count
bounced_count
failed_count
```

배너 조회/클릭률 구성:

```text
promotion_impression_count
promotion_click_count
promotion_click_rate
banner_position
hotel_search_count
hotel_detail_view_count
booking_complete_count
```

### 2.12 설정 / SDK

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

## 3. 도메인 객체, ID, 상태값

### 3.1 공통 ID

| ID | 의미 | 예시 |
|---|---|---|
| `project_id` | 고객사/프로젝트 | `hotel-client-a` |
| `campaign_id` | 캠페인 | `camp_summer_2026` |
| `promotion_id` | 프로모션 | `promo_banner_001` |
| `segment_id` | 프로모션 안의 타겟 세그먼트 | `seg_family_trip` |
| `analysis_id` | 프로모션 분석 결과 | `analysis_banner_001` |
| `generation_id` | 콘텐츠 생성 실행 | `generation_banner_001` |
| `content_id` | 생성 콘텐츠 | `content_banner_001` |
| `content_option_id` | 콘텐츠 후보 | `banner_option_001` |
| `promotion_run_id` | 프로모션의 n번째 루프 묶음 | `run_banner_001` |
| `ad_experiment_id` | 세그먼트별 광고 실험 | `ad_exp_banner_family_001` |
| `evaluation_id` | 평가 결과 | `eval_ad_exp_family_001` |
| `decision_run_id` | AI 실행 감사 로그 | `decision_run_001` |

### 3.2 promotion_run_id와 ad_experiment_id

```text
promotion_run_id:
프로모션의 n번째 루프 전체를 묶는 내부 그룹 ID

ad_experiment_id:
특정 세그먼트에서 실제 진행되는 광고 실험 ID
```

관계:

```text
promotion_id = promo_banner_001
promotion_run_id = run_banner_001

run_banner_001
├── ad_exp_banner_family_001       segment_id = seg_family_trip
├── ad_exp_banner_mobile_001       segment_id = seg_mobile_user
└── ad_exp_banner_near_checkin_001 segment_id = seg_near_checkin
```

### 3.3 금지 ID

공통 API와 화면에서는 아래 ID를 사용하지 않는다.

```text
arm_id
variant_id
creative_id
experiment_id
```

호환이 필요할 경우 내부 매핑만 허용한다.

| legacy | final |
|---|---|
| `variant_id` | `content_option_id` |
| `creative_id` | `content_id` |
| `experiment_id` | `promotion_run_id` 또는 `ad_experiment_id` |

새 코드에서는 `experiment_id`를 만들지 않는다. 광고 실험은 반드시 `ad_experiment_id`로
표현한다.

### 3.4 Campaign

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

Campaign status:

```text
draft
active
paused
completed
stopped
```

### 3.5 Promotion

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

Promotion status:

```text
draft
analysis_ready
content_ready
approved
running
evaluating
goal_met
goal_not_met
stopped
```

### 3.6 Segment Definition

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

Segment status:

```text
planned
content_ready
approved
running
goal_met
goal_not_met
insufficient_data
stopped
```

Segment definition status:

```text
active
archived
```

### 3.7 Content Candidate

Content status:

```text
draft
approved
rejected
active
archived
```

콘텐츠 선택 규칙:

```text
1. AI는 세그먼트별 콘텐츠 후보 N개를 생성한다.
2. 관리자는 세그먼트별로 실제 실험에 사용할 콘텐츠 1개를 승인한다.
3. 승인된 콘텐츠 1개로 해당 세그먼트의 광고 실험 1개를 생성한다.
4. 같은 generation_id + segment_id 안에서 approved 콘텐츠는 1개만 허용한다.
5. MVP에서는 같은 세그먼트 안에서 A/B/C 동시 트래픽 분배를 하지 않는다.
```

### 3.8 Promotion Run

Promotion run status:

```text
planned
approved
running
evaluating
partial_goal_met
goal_met
goal_not_met
insufficient_data
stopped
```

판정 규칙:

```text
모든 ad_experiment가 goal_met
→ promotion_run = goal_met

일부 ad_experiment만 goal_met
→ promotion_run = partial_goal_met

모든 ad_experiment가 goal_not_met
→ promotion_run = goal_not_met
```

### 3.9 Ad Experiment

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

Ad experiment status:

```text
planned
approved
running
evaluating
goal_met
goal_not_met
insufficient_data
stopped
```

상태 전이:

```text
planned
→ approved
→ running
→ evaluating
→ goal_met
```

목표 미달:

```text
running
→ evaluating
→ goal_not_met
→ next-loop 대상
```

## 4. 목표 지표와 이벤트 규약

### 4.1 inflow_rate

Email/SMS 프로모션의 유입율이다. MVP에서는 발송 수를 기준으로 하지 않는다.

```text
inflow_rate =
countDistinct(user_id where event_name = campaign_landing)
/
countDistinct(user_id where event_name = campaign_redirect_click)
```

적용:

```text
email
sms
```

### 4.2 booking_conversion_rate

내부 배너의 예약 전환율이다.

```text
booking_conversion_rate =
countDistinct(user_id where event_name = booking_complete)
/
countDistinct(user_id where event_name = promotion_click)
```

적용:

```text
onsite_banner
```

### 4.3 promotion_click_rate

내부 배너 보조 지표다.

```text
promotion_click_rate =
countDistinct(user_id where event_name = promotion_click)
/
countDistinct(user_id where event_name = promotion_impression)
```

### 4.4 funnel_step_rate

```text
funnel_step_rate = next_step_user_count / previous_step_user_count
```

### 4.5 segment_sample_ratio

```text
segment_sample_ratio = segment_user_count / total_eligible_user_count
```

저장 가능 조건:

```text
segment_user_count >= max(100, total_eligible_user_count * 0.005)
```

### 4.6 공통 event envelope

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

필수 event_name:

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

선택 event_name:

```text
recommendation_request
recommendation_item_impression
```

프로모션 관련 필수 properties:

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

### 4.7 channel별 이벤트 흐름

Email:

```text
campaign_redirect_click
→ campaign_landing
→ hotel_search
→ hotel_click
→ booking_complete
```

SMS:

```text
campaign_redirect_click
→ campaign_landing
→ hotel_search
→ hotel_click
→ booking_complete
```

Onsite banner:

```text
promotion_impression
→ promotion_click
→ hotel_search 또는 hotel_detail_view
→ booking_complete
```

평가 단위:

```text
ad_experiment_id
segment_id
promotion_run_id
```

## 5. Dashboard Segment Query / ChatKit API

Base path:

```text
/api/dashboard/v1
```

ChatKit base path:

```text
/api/chatkit/v1
```

Dashboard API가 책임지는 기능:

```text
1. 자연어 세그먼트 쿼리
2. SQL preview
3. 사용자 정의 세그먼트 저장
4. ChatKit session/action/confirmation 처리
5. 세그먼트 결과 설명
6. funnel definition 저장
```

Decision API는 세그먼트 query-preview, 사용자 정의 세그먼트 저장, ChatKit session/action을
제공하지 않는다.

### 5.1 SQL Preview 생성

```http
POST /api/dashboard/v1/segments/query-preview
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

처리:

```text
1. Dashboard API가 OpenAI/ChatKit action 또는 내부 LLM adapter로 SQL을 생성한다.
2. SQL Safety Validator로 SELECT/WITH만 허용한다.
3. project_id 조건과 LIMIT 존재 여부를 검증한다.
4. ClickHouse read-only query를 실행한다.
5. sample_size, sample_ratio를 계산한다.
6. segment_query_previews에 저장한다.
7. UI에 generated_sql과 preview table을 반환한다.
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

### 5.2 세그먼트 저장

```http
POST /api/dashboard/v1/segments
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
저장된 세그먼트는 segment_definitions에 저장한다.
Decision은 다음 promotion analysis 시 segment_definitions를 읽는다.
```

Response:

```json
{
  "segment_id": "seg_repeat_hotel_no_booking",
  "project_id": "hotel-client-a",
  "segment_name": "같은 숙소 반복 조회 후 미예약 고객",
  "source": "custom_chatkit",
  "query_preview_id": "seg_query_preview_001",
  "sample_size": 1342,
  "sample_ratio": 0.018,
  "status": "active"
}
```

### 5.3 Segment 조회

```http
GET /api/dashboard/v1/segments?project_id=hotel-client-a
```

Response:

```json
{
  "segments": [
    {
      "segment_id": "seg_repeat_hotel_no_booking",
      "segment_name": "같은 숙소 반복 조회 후 미예약 고객",
      "source": "custom_chatkit",
      "sample_size": 1342,
      "sample_ratio": 0.018,
      "status": "active"
    }
  ]
}
```

### 5.4 ChatKit Session 생성

```http
POST /api/chatkit/v1/sessions
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "context": {
    "page": "segments",
    "campaign_id": "camp_summer_2026"
  }
}
```

Response:

```json
{
  "client_secret": "...",
  "thread_id": "chat_thread_001"
}
```

OpenAI API key는 Dashboard Web에 노출하지 않는다. Dashboard Web은 client_secret만 사용한다.

### 5.5 ChatKit Action 처리

```http
POST /api/chatkit/v1/actions
```

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

Action 처리 원칙:

```text
query_segment:
- Dashboard API의 query-preview 로직을 호출한다.
- generated_sql과 preview table을 UI에 보여준다.
- write action이 아니므로 확인 없이 실행 가능하다.

create_segment_definition:
- query_preview_id 기반으로 segment_definitions에 저장한다.
- write action이므로 사용자 확인이 필요하다.

generate_content_for_segment:
- Dashboard가 Decision generation을 요청할 수 있다.
- write action이므로 사용자 확인이 필요하다.

start_next_loop:
- Dashboard가 Decision next-loop를 요청할 수 있다.
- write action이므로 사용자 확인이 필요하다.

explain_experiment_result:
- DB의 promotion_evaluations/ad_experiments를 읽어 설명한다.
- read action이다.

create_funnel_definition:
- funnel_definitions/funnel_steps를 저장한다.
- write action이므로 사용자 확인이 필요하다.
```

Write성 action:

```text
create_segment_definition
start_next_loop
generate_content_for_segment
create_funnel_definition
```

위 action은 반드시 사용자 확인 후 실행한다.

저장 위치:

```text
ai_chat_sessions
ai_chat_messages
ai_action_runs
```

### 5.6 Dashboard와 Decision 연동 규칙

일반 세그먼트 작업 흐름:

```text
자연어 입력
→ Dashboard API SQL preview 생성
→ segment_query_previews 저장
→ 사용자 확인
→ segment_definitions 저장
→ 이후 Decision analysis가 DB에서 segment_definitions를 읽음
```

예외:

```text
사용자가 ChatKit을 통해 콘텐츠 생성 또는 next-loop 시작을 명시적으로 확인한 경우,
Dashboard API가 Decision의 generation 또는 next-loop API를 호출할 수 있다.
```

## 6. AI Decision API

Base path:

```text
/decision/v1
```

Decision API는 계산/생성/평가를 트리거하는 write-oriented API만 제공한다. Dashboard가
단순 조회나 광고 실행을 위해 Decision API를 반복 호출하지 않는다.

Decision API가 책임지는 것:

```text
1. 프로모션 분석 생성
2. 콘텐츠 생성
3. promotion_run 및 ad_experiment 생성
4. promotion_run 대상 유저-세그먼트 매칭 결과를 DB에 생성
5. ad_experiment 평가
6. promotion_run 전체 평가
7. 실패 세그먼트 next-loop 생성
```

Decision API가 책임지지 않는 것:

```text
1. 자연어 → SQL preview
2. 사용자 정의 세그먼트 저장
3. ChatKit session/action 처리
4. 배너 resolve 시점의 실시간 segment-match
5. Dashboard 단순 조회용 GET API
```

### 6.1 프로모션 분석 생성

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

처리:

```text
1. promotions 조회
2. segment_definitions 및 기본 세그먼트 조회
3. 프로모션 목표에 맞는 target segment 결정
4. promotion_analyses 저장
5. promotion_target_segments 저장
6. segment_vectors 저장 또는 갱신
```

Response:

```json
{
  "analysis_id": "analysis_banner_001",
  "promotion_id": "promo_banner_001",
  "status": "completed",
  "target_segments": [
    {
      "segment_id": "seg_repeat_hotel_no_booking",
      "segment_name": "같은 숙소 반복 조회 후 미예약 고객",
      "segment_vector_id": "segvec_repeat_hotel_no_booking_v1",
      "estimated_size": 1342,
      "content_brief": {
        "message_direction": "무료 취소, 당일 예약 가능성, 조식 포함 조건 강조",
        "keywords": ["무료 취소", "당일 예약", "조식", "모바일"]
      }
    }
  ]
}
```

`focus_segment_ids`는 next-loop에서 실패 세그먼트만 다시 분석할 때 사용한다.

### 6.2 콘텐츠 생성

```http
POST /decision/v1/promotions/{promotion_id}/generation
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001",
  "analysis_id": "analysis_banner_001",
  "content_option_count": 3,
  "operator_instruction": null
}
```

처리:

```text
1. promotion_target_segments 조회
2. segment_definitions, generated_sql, data_evidence 조회
3. 세그먼트별 content_candidates 생성
4. generation_runs 저장
5. content_candidates 저장
6. 생성 이유/근거 리포트 저장
```

### 6.3 콘텐츠 상태 변경

```http
PATCH /decision/v1/contents/{content_id}/status
```

Request:

```json
{
  "status": "approved"
}
```

MVP 제약:

```text
같은 generation_id + segment_id 안에서 approved 콘텐츠는 1개만 허용한다.
```

### 6.4 promotion_run 및 ad_experiment 생성

```http
POST /decision/v1/promotions/{promotion_id}/runs
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001",
  "analysis_id": "analysis_banner_001",
  "generation_id": "generation_banner_001"
}
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "loop_count": 1,
  "status": "planned",
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

저장 규칙:

```text
1. promotion_run 1개를 저장한다.
2. promotion_target_segments 수만큼 ad_experiments를 저장한다.
3. 같은 promotion_run_id + segment_id 조합에는 ad_experiment_id가 1개만 존재한다.
4. Dashboard는 이후 ad_experiments/content_candidates를 DB에서 조회해 화면에 표시한다.
```

### 6.5 promotion_run 세그먼트 매칭 결과 생성

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/segment-assignments/build
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "promotion_run_id": "run_banner_001",
  "assignment_scope": "eligible_users"
}
```

처리:

```text
1. promotion_run의 ad_experiments 조회
2. 각 ad_experiment의 segment_vector 조회
3. eligible user의 user_behavior_vectors 조회
4. cosine similarity로 user_id → segment_id 매칭
5. matched segment에 해당하는 ad_experiment_id/content_id/content_option_id를 함께 저장
6. user_segment_assignments에 upsert
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "assignment_count": 18420,
  "status": "completed"
}
```

저장되는 핵심 필드:

```text
promotion_run_id
user_id
segment_id
ad_experiment_id
content_id
content_option_id
similarity_score
fallback
assigned_at
expires_at
```

이 API는 광고 요청마다 호출하지 않는다. promotion_run 시작 시점, segment 변경 시점, 또는
배치 갱신 시점에만 호출한다.

### 6.6 ad_experiment 평가

```http
POST /decision/v1/ad-experiments/{ad_experiment_id}/evaluate
```

Response:

```json
{
  "evaluation_id": "eval_ad_exp_repeat_hotel_001",
  "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "segment_id": "seg_repeat_hotel_no_booking",
  "metric": "booking_conversion_rate",
  "target_value": 0.03,
  "actual_value": 0.024,
  "sample_size": 1800,
  "status": "goal_not_met",
  "next_loop_required": true,
  "feedback": "같은 숙소 반복 조회 후 미예약 고객은 목표 전환율에 도달하지 못했습니다."
}
```

### 6.7 promotion_run 전체 평가

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/evaluate
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "status": "partial_goal_met",
  "ad_experiment_results": [
    {
      "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
      "segment_id": "seg_repeat_hotel_no_booking",
      "actual_value": 0.024,
      "status": "goal_not_met"
    }
  ],
  "next_loop_required": true,
  "failed_segment_ids": ["seg_repeat_hotel_no_booking"],
  "failed_ad_experiment_ids": ["ad_exp_banner_repeat_hotel_001"]
}
```

집계 규칙:

```text
goal_basis = all_segments:
모든 ad_experiment가 goal_met이어야 promotion_run도 goal_met

goal_basis = promotion_average:
ad_experiment들을 합산한 전체 평균이 목표 이상이면 promotion_run goal_met
```

저장 규칙:

```text
promotion_evaluations에 ad_experiment_id 기준 결과를 저장한다.
Dashboard는 결과 화면에서 promotion_evaluations를 DB 조회한다.
```

### 6.8 next-loop 생성

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

처리:

```text
1. 실패 세그먼트만 새 analysis 대상으로 설정한다.
2. operator_instruction이 있으면 analysis/generation input에 반영한다.
3. 실패 세그먼트만 content_candidates를 다시 생성한다.
4. 새 promotion_run과 새 ad_experiments를 저장한다.
5. 필요하면 segment-assignments/build를 다시 실행한다.
```

Response:

```json
{
  "previous_promotion_run_id": "run_banner_001",
  "next_promotion_run_id": "run_banner_002",
  "promotion_id": "promo_banner_001",
  "loop_count": 2,
  "next_analysis_id": "analysis_banner_002",
  "next_generation_id": "generation_banner_002",
  "next_ad_experiments": [
    {
      "ad_experiment_id": "ad_exp_banner_repeat_hotel_002",
      "segment_id": "seg_repeat_hotel_no_booking",
      "status": "planned"
    }
  ]
}
```

규칙:

```text
operator_instruction은 optional이다.
failed_segment_ids가 없으면 next-loop를 생성하지 않는다.
max_loop_count를 초과하면 stopped 처리한다.
성공한 세그먼트는 재실험하지 않는다.
```

## 7. Dashboard 광고 실행 API

Base path:

```text
/api/ad/v1
```

광고 실행 hot path에서 Dashboard API는 Decision API를 호출하지 않는다. Decision은
promotion_run 시작 시 세그먼트 매칭 결과와 active content를 DB에 저장한다. Dashboard API는
banner resolve, dispatch, redirect 처리 시 DB를 조회한다.

필수 DB 조회 대상:

```text
ad_experiments
content_candidates
user_segment_assignments
redirect_links
promotion_runs
promotions
```

권장 Data Source view:

```text
active_ad_serving_assignments
```

이 view 또는 equivalent query는 아래 정보를 한 번에 조회할 수 있어야 한다.

```text
project_id
promotion_run_id
user_id
segment_id
ad_experiment_id
content_id
content_option_id
channel
title/body/cta/message/landing_url
```

### 7.1 배너 resolve

```http
GET /api/ad/v1/banner/resolve?project_id=hotel-client-a&promotion_run_id=run_banner_001&user_id=user_123&placement_id=home_top
```

처리:

```text
1. user_segment_assignments에서 promotion_run_id + user_id 조회
2. assignment에 저장된 segment_id / ad_experiment_id / content_id / content_option_id 확인
3. content_candidates에서 content 조회
4. content 반환
5. promotion_impression 이벤트 전송
```

fallback 규칙:

```text
1. user_segment_assignments에 user_id가 없으면 fallback segment를 조회한다.
2. fallback segment도 없으면 해당 promotion_run의 기본 콘텐츠를 반환한다.
3. fallback이 발생해도 Decision API를 동기 호출하지 않는다.
4. 필요하면 비동기 assignment refresh job을 enqueue할 수 있다.
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "ad_experiment_id": "ad_exp_banner_repeat_hotel_001",
  "segment_id": "seg_repeat_hotel_no_booking",
  "content_id": "content_banner_repeat_hotel_001",
  "content_option_id": "banner_repeat_hotel_option_001",
  "title": "이번 주말 남은 객실, 지금 바로 확정",
  "body": "같은 숙소를 여러 번 확인한 고객님께 무료 취소 가능한 특가를 보여드립니다.",
  "cta": "특가 숙소 보기",
  "target_url": "https://demo-stay.example.com/summer"
}
```

### 7.2 dispatch

email/sms 발송 job을 시작한다.

```http
POST /api/ad/v1/promotion-runs/{promotion_run_id}/dispatch
```

처리:

```text
1. promotion_run 조회
2. user_segment_assignments에서 대상 user와 ad_experiment/content 조회
3. channel=email/sms에 맞춰 redirect_links 생성
4. ad_dispatch_jobs 저장
5. 외부 발송 provider 또는 mock sender 실행
6. 필요한 이벤트/상태를 저장한다.
```

Dashboard는 발송 대상 세그먼트를 결정하기 위해 Decision API를 호출하지 않는다. 이미 DB에
저장된 assignment를 사용한다.

### 7.3 redirect

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

redirect_links 필수 필드:

```text
redirect_id
project_id
campaign_id
promotion_id
promotion_run_id
ad_experiment_id
user_id
segment_id
content_id
content_option_id
target_url
expires_at
```

## 8. Data Source Contract

Data Source Contract는 PostgreSQL / ClickHouse schema를 관리한다. 서비스 repo는
`schema.sql`을 중복 생성하지 않는다.

### 8.1 PostgreSQL 필수 테이블

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

### 8.2 ad_experiments

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

권장 index:

```sql
CREATE INDEX IF NOT EXISTS idx_ad_experiments_promotion_run_id
ON ad_experiments (promotion_run_id);

CREATE INDEX IF NOT EXISTS idx_ad_experiments_segment_id
ON ad_experiments (segment_id);

CREATE INDEX IF NOT EXISTS idx_ad_experiments_status
ON ad_experiments (status);
```

### 8.3 promotion_evaluations

`promotion_evaluations`는 `ad_experiment_id`를 포함해야 한다.

```sql
ALTER TABLE promotion_evaluations
ADD COLUMN IF NOT EXISTS ad_experiment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_promotion_evaluations_ad_experiment_id
ON promotion_evaluations (ad_experiment_id);
```

권장 FK:

```sql
ALTER TABLE promotion_evaluations
ADD CONSTRAINT fk_promotion_evaluations_ad_experiment
FOREIGN KEY (ad_experiment_id)
REFERENCES ad_experiments (ad_experiment_id);
```

기존 데이터 마이그레이션 부담이 있으면 MVP에서는 FK 없이 index를 먼저 둔다.

### 8.4 user_segment_assignments

핵심 컬럼:

```sql
promotion_run_id VARCHAR(100) NOT NULL
user_id VARCHAR(255) NOT NULL
segment_id VARCHAR(100) NOT NULL
ad_experiment_id VARCHAR(100) NOT NULL
content_id VARCHAR(100) NOT NULL
content_option_id VARCHAR(100) NOT NULL
similarity_score NUMERIC(10, 6)
fallback BOOLEAN NOT NULL DEFAULT false
assigned_at TIMESTAMP NOT NULL DEFAULT now()
expires_at TIMESTAMP
UNIQUE (promotion_run_id, user_id)
```

의미:

```text
promotion_run_id + user_id
→ segment_id
→ ad_experiment_id
→ content_id / content_option_id
```

### 8.5 segment_query_previews

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

### 8.6 segment_definitions

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

### 8.7 funnel_definitions / funnel_steps

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

### 8.8 ChatKit tables

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

### 8.9 dispatch / redirect / content 승인 제약

`ad_dispatch_jobs`는 `ad_experiment_id`를 포함해야 한다.

```sql
ALTER TABLE ad_dispatch_jobs
ADD COLUMN IF NOT EXISTS ad_experiment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_ad_dispatch_jobs_ad_experiment_id
ON ad_dispatch_jobs (ad_experiment_id);
```

`redirect_links`는 `ad_experiment_id`를 포함해야 한다.

```sql
ALTER TABLE redirect_links
ADD COLUMN IF NOT EXISTS ad_experiment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_redirect_links_ad_experiment_id
ON redirect_links (ad_experiment_id);
```

MVP에서는 같은 세그먼트에서 승인 콘텐츠가 1개만 있어야 한다.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_candidates_one_approved_per_segment
ON content_candidates (generation_id, segment_id)
WHERE status = 'approved';
```

### 8.10 active_ad_serving_assignments

Dashboard의 banner resolve/dispatch가 여러 테이블을 매번 복잡하게 join하지 않도록 Data
Source Contract는 아래 view 또는 동등 query를 제공하는 것을 권장한다.

```sql
CREATE OR REPLACE VIEW active_ad_serving_assignments AS
SELECT
    usa.promotion_run_id,
    usa.user_id,
    usa.segment_id,
    usa.ad_experiment_id,
    usa.content_id,
    usa.content_option_id,
    usa.fallback,
    usa.similarity_score,
    ae.project_id,
    ae.campaign_id,
    ae.promotion_id,
    ae.channel,
    cc.subject,
    cc.preheader,
    cc.title,
    cc.body,
    cc.cta,
    cc.message,
    cc.image_prompt,
    cc.landing_url,
    cc.status AS content_status,
    ae.status AS ad_experiment_status
FROM user_segment_assignments usa
JOIN ad_experiments ae
  ON usa.ad_experiment_id = ae.ad_experiment_id
JOIN content_candidates cc
  ON usa.content_id = cc.content_id
WHERE ae.status IN ('approved', 'running')
  AND cc.status IN ('approved', 'active');
```

### 8.11 ClickHouse 필수 테이블/View

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

`promotion_touch_events`, `booking_outcome_events`, `raw_events.properties_json`에는
`ad_experiment_id`가 포함되어야 한다.

`promotion_touch_events` 컬럼:

```sql
ALTER TABLE promotion_touch_events
ADD COLUMN IF NOT EXISTS ad_experiment_id String AFTER promotion_run_id;
```

신규 테이블을 다시 만들 수 있다면 권장 ORDER BY:

```sql
ORDER BY (
    project_id,
    campaign_id,
    promotion_id,
    promotion_run_id,
    ad_experiment_id,
    event_time,
    event_name,
    user_id
)
```

`booking_outcome_events` 컬럼:

```sql
ALTER TABLE booking_outcome_events
ADD COLUMN IF NOT EXISTS ad_experiment_id Nullable(String) AFTER promotion_run_id;
```

Materialized View 추출 키:

```sql
JSONExtractString(properties_json, 'ad_experiment_id') AS ad_experiment_id
```

hotel_detail_events View 예시:

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

### 8.12 세그먼트 광고 실험 평가 쿼리

Email/SMS inflow_rate:

```sql
SELECT
    ad_experiment_id,
    segment_id,
    countDistinctIf(user_id, event_name = 'campaign_landing') AS numerator_count,
    countDistinctIf(user_id, event_name = 'campaign_redirect_click') AS denominator_count,
    if(denominator_count = 0, 0, numerator_count / denominator_count) AS inflow_rate
FROM promotion_touch_events
WHERE project_id = {project_id:String}
  AND promotion_run_id = {promotion_run_id:String}
  AND ad_experiment_id = {ad_experiment_id:String}
  AND event_name IN ('campaign_redirect_click', 'campaign_landing')
GROUP BY ad_experiment_id, segment_id;
```

Onsite banner booking_conversion_rate:

```sql
WITH
    clicks AS (
        SELECT
            ad_experiment_id,
            segment_id,
            countDistinct(user_id) AS click_users
        FROM promotion_touch_events
        WHERE project_id = {project_id:String}
          AND promotion_run_id = {promotion_run_id:String}
          AND ad_experiment_id = {ad_experiment_id:String}
          AND event_name = 'promotion_click'
        GROUP BY ad_experiment_id, segment_id
    ),
    bookings AS (
        SELECT
            ad_experiment_id,
            segment_id,
            countDistinct(user_id) AS booking_users
        FROM booking_outcome_events
        WHERE project_id = {project_id:String}
          AND promotion_run_id = {promotion_run_id:String}
          AND ad_experiment_id = {ad_experiment_id:String}
          AND event_name = 'booking_complete'
        GROUP BY ad_experiment_id, segment_id
    )
SELECT
    c.ad_experiment_id,
    c.segment_id,
    booking_users AS numerator_count,
    click_users AS denominator_count,
    if(click_users = 0, 0, booking_users / click_users) AS booking_conversion_rate
FROM clicks c
LEFT JOIN bookings b
    ON c.ad_experiment_id = b.ad_experiment_id
   AND c.segment_id = b.segment_id;
```

## 9. Repository 책임 범위

### 9.1 loop-ad_context

```text
프로젝트 공통 reference와 원본 계약서를 보관한다.
이 문서는 구현 repo의 README/CONTRIBUTING을 대체하지 않는다.
```

### 9.2 loop-ad_data-source_contract

```text
PostgreSQL 호텔 도메인 core schema
ad_experiments / promotion_evaluations / user_segment_assignments
segment_query_previews / segment_definitions
funnel_definitions / funnel_steps
ChatKit persistence tables
ClickHouse hotel_rec_promo.v1 typed table/view
공통 seed/fixture
```

### 9.3 loop-ad_event_sdk

```text
hotel_rec_promo.v1 envelope mode
호텔 이벤트 helper
DOM 자동 수집의 호텔 이벤트 변환
SDK script 호환성
```

### 9.4 loop-ad_event_collector

```text
envelope validation
프로모션 이벤트 필수 properties 검증
Kafka raw publish
validation error 저장 연동
```

### 9.5 loop-ad_decision

```text
Decision lifecycle DTO / Enum / Router
프로모션 분석
콘텐츠 생성과 생성 이유 리포트
ad_experiment 생성
64차원 세그먼트 매칭 배치 생성
평가와 next-loop
ChatKit/세그먼트 쿼리 endpoint 제외
```

### 9.6 loop-ad_dashboard

```text
호텔 도메인 shared types / DB repository / API client
메인 대시보드 / 마케팅 기획서
실시간 추이
퍼널
세그먼트 페이지와 SQL Preview API
사용자 정의 세그먼트 저장 API
ChatKit UI와 Dashboard action backend
AI 생성 페이지 리포트
워크플로우 DAG
종료 후 결과 / 재실험 흐름
Dashboard API 광고 실행 모듈
Decision lifecycle 호출
```

### 9.7 loop-ad_advertisement_sdk

```text
final 광고 필드 적용
Dashboard banner resolve 연동
```

### 9.8 loop-ad_demo-shoppingmall_front

```text
화면을 호텔 예약 데모로 교체
호텔 행동 이벤트 삽입
재실험 시나리오용 fixture 추가
배포 이름과 public domain은 기존 demo-shoppingmall 호환을 유지
```

### 9.9 loop-ad_infra

```text
app repository guide 기준 확인
신규 API path routing 점검
Event Collector / Dashboard API / Decision API dev routing
```

### 9.10 제외 repo

```text
loop-ad_local-data-source_contract
loop-ad_advertisement
```

위 repo는 최종 구현 기준에서 제외한다.

## 10. Golden Scenario

### 10.1 입력

```text
Campaign:
2026 여름 특가 세일

Promotion 1:
email / inflow_rate 10% / promotion_average

Promotion 2:
onsite_banner / booking_conversion_rate 3% / all_segments

Promotion 3:
sms / inflow_rate 8% / all_segments
```

### 10.2 AI 분석과 생성

```text
Promotion 2: onsite_banner

AI 분석 결과 세그먼트:
- 가족 여행 고객
- 모바일 탐색 고객
- 체크인 임박 고객
- 같은 숙소 반복 조회 후 미예약 고객

AI 생성 결과:
각 세그먼트별 콘텐츠 후보 3개
```

관리자는 세그먼트별로 콘텐츠 1개씩 승인한다.

### 10.3 광고 실험 생성

```text
promotion_run_id = run_banner_001

ad_experiment_id = ad_exp_banner_family_001
segment_id = seg_family_trip
content_id = content_banner_family_001

ad_experiment_id = ad_exp_banner_mobile_001
segment_id = seg_mobile_user
content_id = content_banner_mobile_001

ad_experiment_id = ad_exp_banner_near_checkin_001
segment_id = seg_near_checkin
content_id = content_banner_near_checkin_001

ad_experiment_id = ad_exp_banner_repeat_hotel_001
segment_id = seg_repeat_hotel_no_booking
content_id = content_banner_repeat_hotel_001
```

### 10.4 세그먼트 매칭 배치

```text
Decision:
run_banner_001 대상 eligible_users에 대해 user_segment_assignments를 생성한다.

Dashboard:
banner resolve / dispatch / redirect에서 user_segment_assignments와 active_ad_serving_assignments를 조회한다.
```

### 10.5 평가

```text
ad_exp_banner_family_001:
actual = 2.4%
target = 3.0%
status = goal_not_met

ad_exp_banner_mobile_001:
actual = 3.4%
target = 3.0%
status = goal_met

ad_exp_banner_near_checkin_001:
actual = 1.9%
target = 3.0%
status = goal_not_met

ad_exp_banner_repeat_hotel_001:
actual = 2.6%
target = 3.0%
status = goal_not_met
```

### 10.6 next-loop

관리자가 optional 지침을 입력할 수 있다.

```text
가족 여행 고객:
무료 취소보다 조식 포함과 수영장 혜택을 강조해줘.

체크인 임박 고객:
오늘 예약 가능, 즉시 확정 문구를 더 강하게 써줘.

같은 숙소 반복 조회 후 미예약 고객:
마감 임박보다 무료 취소와 당일 확정 가능성을 강조해줘.
```

Decision은 실패 세그먼트만 다시 루프를 만든다.

```text
run_banner_002
├── ad_exp_banner_family_002
├── ad_exp_banner_near_checkin_002
└── ad_exp_banner_repeat_hotel_002
```

목표를 달성한 모바일 탐색 고객은 재실험하지 않는다.

## 11. 최종 수용 기준

```text
[ ] 화면 계층이 Campaign → Promotion → Segment → Ad Experiment인가?
[ ] 프로모션별로 세그먼트가 생성되거나 저장되는가?
[ ] 세그먼트별로 광고 실험이 1개씩 생성되는가?
[ ] 같은 promotion_run_id + segment_id에 ad_experiment가 2개 이상 생기지 않는가?
[ ] promotion_run_id는 루프 묶음이고 ad_experiment_id가 실제 광고 실험 ID인가?
[ ] 콘텐츠 후보는 여러 개 생성하되 세그먼트별 승인 콘텐츠는 1개인가?
[ ] 자연어 세그먼트 SQL preview와 저장은 Dashboard API 책임인가?
[ ] ChatKit session/action은 Dashboard API 책임인가?
[ ] Decision은 분석/생성/매칭 배치/평가/next-loop만 책임지는가?
[ ] Dashboard 광고 실행 hot path에서 Decision API를 호출하지 않는가?
[ ] user_segment_assignments가 ad_experiment_id/content_id/content_option_id를 포함하는가?
[ ] banner resolve / dispatch / redirect가 DB 조회 기반으로 동작하는가?
[ ] 모든 프로모션 이벤트 properties에 ad_experiment_id가 포함되는가?
[ ] 평가는 ad_experiment_id 기준으로 가능한가?
[ ] 목표 미달 시 failed_segment_ids / failed_ad_experiment_ids만 next-loop 대상인가?
[ ] operator_instruction은 optional인가?
[ ] operator_instruction이 있으면 다음 분석/생성 input에 반영되는가?
[ ] 목표 달성 세그먼트는 재실험하지 않는가?
[ ] schema.sql은 Data Source Contract에서만 관리되는가?
[ ] 기존 env 이름과 .github workflow가 유지되는가?
```

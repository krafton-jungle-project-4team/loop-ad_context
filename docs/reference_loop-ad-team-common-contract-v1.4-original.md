# Loop-Ad 팀 공통 구현 계약서 v1.4

> 대상 팀: Dashboard(광고 실행 포함), 수집/SDK, AI Decision, Data Source Contract  
> 기준 도메인: 호텔/숙박 예약  
> 최종 계층: **캠페인 → 프로모션 → 세그먼트 → 광고 실험**  
> 최종 루프: **세그먼트별 광고 실험 평가 → 목표 미달 세그먼트만 분석 → 생성 → 실험 재실행**  
> 이 문서는 v1.3에서 부족했던 “세그먼트당 광고 실험 1개” 규칙을 반영한 수정본이다.

---

## 0. 이번 버전에서 반드시 고정하는 것

### 0.1 서비스 계층

Loop-Ad의 서비스 계층은 아래로 고정한다.

```text
Campaign
└── Promotion
    └── Segment
        └── Ad Experiment
```

각 계층의 의미는 다음과 같다.

| 계층 | 의미 | 예시 |
|---|---|---|
| Campaign | 큰 마케팅 기획 단위 | 2026 여름 특가 세일 |
| Promotion | 캠페인 안의 채널별 실행 단위 | Email, SMS, 내부 사이트 배너 |
| Segment | 해당 프로모션에서 타겟팅할 고객군 | 가족 여행 고객, 모바일 탐색 고객 |
| Ad Experiment | 특정 세그먼트에 대해 실제로 실행되는 광고 실험 | 가족 여행 고객용 배너 실험 1회차 |

중요한 규칙:

```text
1. 세그먼트는 캠페인 전체에 고정하지 않는다.
2. 세그먼트는 프로모션별로 생성된다.
3. 광고 실험은 세그먼트별로 생성된다.
4. MVP에서는 세그먼트당 동시에 실행되는 광고 실험은 1개다.
```

---

### 0.2 기존 v1.3에서 맞지 않았던 점

v1.3은 “프로모션별 분석 → 생성 → 실험” 구조는 맞았지만, 실행 단위가 `promotion_run` 중심이었다.

```text
기존 v1.3:
Campaign
└── Promotion
    └── Promotion Run
        └── 여러 Segment 결과
```

이 구조는 “세그먼트당 광고 실험 1개”를 명확하게 표현하지 못한다.

따라서 v1.4에서는 아래로 수정한다.

```text
수정 v1.4:
Campaign
└── Promotion
    └── Segment
        └── Ad Experiment
```

기술적으로는 `promotion_run_id`를 유지하되, 이것은 사용자-facing 계층이 아니라 **프로모션의 n번째 루프를 묶는 내부 그룹 ID**로만 사용한다.

```text
promotion_run_id = 프로모션의 n번째 실행 루프 묶음
ad_experiment_id = 특정 세그먼트에서 실제 진행되는 광고 실험
```

---

### 0.3 세그먼트당 광고 실험 1개 규칙

MVP에서는 한 프로모션 안에서 AI가 여러 세그먼트를 만들 수 있다.

예:

```text
프로모션: 내부 사이트 배너
목표: 예약 전환율 3%
목표 기준: 모든 세그먼트가 만족할 때까지

생성 세그먼트:
- seg_family_trip
- seg_mobile_user
- seg_near_checkin
```

이때 광고 실험은 세그먼트별로 1개씩 생성된다.

```text
seg_family_trip       → ad_exp_banner_family_001
seg_mobile_user       → ad_exp_banner_mobile_001
seg_near_checkin      → ad_exp_banner_near_checkin_001
```

즉, 한 promotion_run 안에 여러 ad_experiment가 있고, 각 ad_experiment는 정확히 하나의 segment를 담당한다.

```text
promotion_run_id = run_banner_001
├── ad_experiment_id = ad_exp_banner_family_001       segment_id = seg_family_trip
├── ad_experiment_id = ad_exp_banner_mobile_001       segment_id = seg_mobile_user
└── ad_experiment_id = ad_exp_banner_near_checkin_001 segment_id = seg_near_checkin
```

---

### 0.4 콘텐츠 후보와 광고 실험의 관계

AI 생성 단계에서는 세그먼트별로 N개의 콘텐츠 후보를 만들 수 있다.

```text
seg_family_trip
├── content_option_001
├── content_option_002
└── content_option_003
```

Dashboard 관리자는 이 중 하나를 승인한다.

MVP 규칙:

```text
1. AI는 세그먼트별 콘텐츠 후보 N개를 생성한다.
2. 관리자는 세그먼트별로 실제 실험에 사용할 콘텐츠 1개를 승인한다.
3. 승인된 콘텐츠 1개로 해당 세그먼트의 광고 실험 1개를 생성한다.
```

따라서 MVP에서는 같은 세그먼트 안에서 A/B/C 동시 분배 실험을 하지 않는다.

```text
하지 않음:
seg_family_trip 안에서 A/B/C 트래픽 분배

함:
seg_family_trip에 대해 승인 콘텐츠 1개로 광고 실험 1개 실행
```

나중에 확장하려면 `ad_experiment_contents` 같은 매핑 테이블을 두고 한 광고 실험 안에 여러 content option을 넣을 수 있지만, MVP에서는 제외한다.

---

### 0.5 목표 미달 시 루프

광고 실험이 목표를 달성하지 못하면, 해당 세그먼트만 다시 루프를 돈다.

```text
ad_experiment 평가
→ goal_met이면 종료
→ goal_not_met이면 관리자 추가 지침 optional 입력
→ 실패 세그먼트만 다시 분석
→ 실패 세그먼트만 다시 생성
→ 실패 세그먼트의 새 광고 실험 생성
```

관리자의 추가 지침은 선택값이다.

```text
operator_instruction = optional
```

관리자가 지침을 입력하지 않으면 AI Decision이 기존 평가 결과와 기본 규칙으로 다음 루프를 만든다.

관리자가 지침을 입력하면 다음 분석/생성에 반영한다.

예:

```json
{
  "operator_instruction": "무료 취소보다 조식 포함과 수영장 혜택을 더 강조해줘."
}
```

---

## 1. 최종 사용자 시나리오

### 1.1 고객 페르소나

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

---

### 1.2 캠페인 생성

```json
{
  "campaign_id": "camp_summer_2026",
  "name": "2026 여름 특가 세일",
  "objective": "기존 유저의 여름 숙박 예약 전환 증가",
  "target_audience": "existing_users",
  "start_date": "2026-07-15",
  "end_date": "2026-08-31",
  "primary_metric": "booking_conversion_rate"
}
```

---

### 1.3 프로모션 생성

| promotion | channel | target | goal_metric | target_value | goal_basis |
|---|---|---|---|---:|---|
| 프로모션 1 | email | existing_users | inflow_rate | 0.10 | promotion_average |
| 프로모션 2 | onsite_banner | existing_users | booking_conversion_rate | 0.03 | all_segments |
| 프로모션 3 | sms | existing_users | inflow_rate | 0.08 | all_segments |

---

### 1.4 프로모션별 세그먼트와 광고 실험

예를 들어 내부 배너 프로모션은 아래처럼 실행된다.

```text
Campaign: 2026 여름 특가 세일
└── Promotion: 내부 사이트 배너
    ├── Segment: 가족 여행 고객
    │   └── Ad Experiment: 가족 여행 고객용 배너 실험
    ├── Segment: 모바일 탐색 고객
    │   └── Ad Experiment: 모바일 탐색 고객용 배너 실험
    └── Segment: 체크인 임박 고객
        └── Ad Experiment: 체크인 임박 고객용 배너 실험
```

---

## 2. 공통 ID 규약

### 2.1 최종 ID

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

---

### 2.2 promotion_run_id와 ad_experiment_id 차이

```text
promotion_run_id:
프로모션의 n번째 루프 전체를 묶는 내부 그룹 ID

ad_experiment_id:
특정 세그먼트에서 실제 진행되는 광고 실험 ID
```

예:

```text
promotion_id = promo_banner_001
promotion_run_id = run_banner_001

ad_experiment_id = ad_exp_banner_family_001
segment_id = seg_family_trip
```

관계:

```text
promotion_run_id 1개
→ ad_experiment_id 여러 개
→ 단, segment_id당 ad_experiment_id는 1개
```

---

### 2.3 금지 ID

아래 ID는 공통 API와 화면에서 사용하지 않는다.

```text
arm_id
variant_id
creative_id
experiment_id
```

호환이 필요할 경우에만 내부 매핑한다.

| legacy | final |
|---|---|
| `variant_id` | `content_option_id` |
| `creative_id` | `content_id` |
| `experiment_id` | `promotion_run_id` 또는 `ad_experiment_id` |

새 코드에서는 `experiment_id`를 만들지 않는다.  
광고 실험을 표현할 때는 반드시 `ad_experiment_id`를 사용한다.

---

## 3. 상태값 규약

### 3.1 Campaign Status

```text
draft
active
paused
completed
stopped
```

---

### 3.2 Promotion Status

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

---

### 3.3 Segment Status

프로모션 안의 세그먼트 상태다.

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

---

### 3.4 Content Status

```text
draft
approved
rejected
active
archived
```

---

### 3.5 Promotion Run Status

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

`promotion_run`은 여러 segment ad_experiment를 묶는다.

판정 규칙:

```text
모든 ad_experiment가 goal_met
→ promotion_run = goal_met

일부 ad_experiment만 goal_met
→ promotion_run = partial_goal_met

모든 ad_experiment가 goal_not_met
→ promotion_run = goal_not_met
```

---

### 3.6 Ad Experiment Status

세그먼트별 광고 실험 상태다.

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

---

## 4. AI Decision 기능 범위

AI Decision은 세 기능으로 나눈다.

```text
분석
생성
실험
```

---

### 4.1 분석

분석은 프로모션 목표를 달성하기 위해 어떤 세그먼트를 대상으로 할지 정하는 단계다.

입력:

```json
{
  "project_id": "hotel-client-a",
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001"
}
```

처리:

```text
1. promotion 목표 조회
2. channel / goal_metric / goal_basis 해석
3. Expedia 기반 호텔 행동 profile 조회
4. 프로모션에 맞는 target_segment 결정
5. target_segment별 content_brief 생성
6. target_segment별 segment_vector 생성 또는 조회
```

출력:

```json
{
  "analysis_id": "analysis_banner_001",
  "promotion_id": "promo_banner_001",
  "target_segments": [
    {
      "segment_id": "seg_family_trip",
      "segment_name": "가족 여행 고객",
      "segment_vector_id": "segvec_family_trip_v1",
      "estimated_size": 12840,
      "content_brief": {
        "message_direction": "가족 여행, 조식, 무료 취소, 아동 동반 편의 강조",
        "keywords": ["가족", "아이", "조식", "무료 취소"]
      }
    }
  ]
}
```

---

### 4.2 생성

생성은 세그먼트별 광고 콘텐츠 후보를 만드는 단계다.

입력:

```json
{
  "project_id": "hotel-client-a",
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001",
  "analysis_id": "analysis_banner_001",
  "content_option_count": 3
}
```

처리:

```text
1. analysis 결과 조회
2. segment별 content_brief 조회
3. channel별 생성 필드 결정
4. segment별 content_option_count개 후보 생성
5. content_candidates 저장
```

MVP 승인 규칙:

```text
Dashboard 관리자는 세그먼트별로 content_candidate 1개를 승인한다.
승인된 content_candidate 1개가 해당 세그먼트의 ad_experiment에 사용된다.
```

---

### 4.3 실험

실험은 승인된 콘텐츠를 세그먼트별 광고 실험으로 만들고 평가하는 단계다.

처리:

```text
1. promotion_run 생성
2. target_segment별 ad_experiment 1개씩 생성
3. ad_experiment별 승인 콘텐츠 연결
4. active content 제공
5. segment-match 제공
6. 이벤트 기반 목표 평가
7. 목표 미달 ad_experiment만 next-loop 대상 처리
```

---

## 5. 세그먼트별 광고 실험 규약

### 5.1 생성 규칙

`POST /decision/v1/promotions/{promotion_id}/runs` 호출 시 AI Decision은 아래를 생성한다.

```text
1. promotion_run 1개
2. target_segment 수만큼 ad_experiment 생성
```

예:

```json
{
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "loop_count": 1,
  "ad_experiments": [
    {
      "ad_experiment_id": "ad_exp_banner_family_001",
      "segment_id": "seg_family_trip",
      "content_id": "content_banner_family_001",
      "content_option_id": "banner_family_option_001",
      "status": "planned"
    },
    {
      "ad_experiment_id": "ad_exp_banner_mobile_001",
      "segment_id": "seg_mobile_user",
      "content_id": "content_banner_mobile_001",
      "content_option_id": "banner_mobile_option_001",
      "status": "planned"
    }
  ]
}
```

---

### 5.2 uniqueness 규칙

Data Source Contract는 아래 unique 제약을 둔다.

```text
UNIQUE (promotion_run_id, segment_id)
```

의미:

```text
같은 promotion_run 안에서 같은 segment_id는 광고 실험을 1개만 가진다.
```

---

### 5.3 콘텐츠 선택 규칙

MVP에서 한 ad_experiment는 하나의 콘텐츠만 가진다.

```text
ad_experiment_id 1개
→ segment_id 1개
→ content_id 1개
→ content_option_id 1개
```

향후 A/B 테스트가 필요해지면 아래처럼 확장한다.

```text
ad_experiment_id 1개
→ content_option_id 여러 개
→ traffic split
```

하지만 MVP에서는 하지 않는다.

---

### 5.4 평가 규칙

광고 실험 평가는 `ad_experiment_id` 기준으로 한다.

```text
ad_experiment_id = ad_exp_banner_family_001
metric = booking_conversion_rate
target_value = 0.03
actual_value = 0.024
status = goal_not_met
```

promotion_run 평가는 ad_experiment 평가를 집계한다.

```text
all_segments:
모든 ad_experiment가 goal_met이어야 promotion_run도 goal_met

promotion_average:
ad_experiment들을 합산한 전체 평균이 목표 이상이면 promotion_run goal_met
```

---

### 5.5 next-loop 규칙

목표 미달 광고 실험만 다음 루프 대상이다.

```text
ad_exp_banner_family_001 = goal_not_met
ad_exp_banner_mobile_001 = goal_met

next-loop 대상:
seg_family_trip만
```

다음 루프에서는 실패 세그먼트만 다시 분석/생성/실험한다.

```text
seg_family_trip
→ analysis_banner_002
→ generation_banner_002
→ run_banner_002
→ ad_exp_banner_family_002
```

성공한 세그먼트는 재실험하지 않는다.

---

### 5.6 관리자 추가 지침

관리자는 목표 미달 세그먼트에 대해 추가 지침을 입력할 수 있다.

입력은 optional이다.

```json
{
  "operator_instruction": "가족 여행 고객에게는 가격보다 무료 취소와 조식 포함 혜택을 더 강조해줘."
}
```

반영 위치:

```text
next-loop analysis input
next-loop generation prompt
```

관리자 지침이 없으면 AI Decision은 기본 feedback으로 다음 루프를 만든다.

---

## 6. 목표 지표 규약

### 6.1 inflow_rate

email/sms 프로모션의 유입율이다.

MVP에서는 발송 수를 기준으로 하지 않는다.  
수집 스키마에서 email/sms 발송 이벤트를 수집하지 않기 때문이다.

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

---

### 6.2 booking_conversion_rate

onsite_banner 프로모션의 예약 전환율이다.

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

---

### 6.3 promotion_click_rate

내부 배너 보조 지표다.

```text
promotion_click_rate =
  countDistinct(user_id where event_name = promotion_click)
  /
  countDistinct(user_id where event_name = promotion_impression)
```

---

## 7. 이벤트 수집 규약 변경

### 7.1 필수 프로모션 properties

모든 프로모션 관련 이벤트는 `properties`에 아래 값을 포함해야 한다.

```json
{
  "campaign_id": "camp_summer_2026",
  "promotion_id": "promo_banner_001",
  "promotion_run_id": "run_banner_001",
  "ad_experiment_id": "ad_exp_banner_family_001",
  "promotion_channel": "onsite_banner",
  "segment_id": "seg_family_trip",
  "content_id": "content_banner_001",
  "content_option_id": "banner_option_001"
}
```

v1.3 대비 추가된 필수값:

```text
ad_experiment_id
```

이 값이 없으면 세그먼트별 광고 실험 결과를 정확히 평가할 수 없다.

---

### 7.2 channel별 이벤트 흐름

#### email

```text
campaign_redirect_click
→ campaign_landing
→ hotel_search
→ hotel_click
→ booking_complete
```

평가 단위:

```text
ad_experiment_id
segment_id
promotion_run_id
```

#### sms

```text
campaign_redirect_click
→ campaign_landing
→ hotel_search
→ hotel_click
→ booking_complete
```

평가 단위:

```text
ad_experiment_id
segment_id
promotion_run_id
```

#### onsite_banner

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

---

## 8. AI Decision API 계약

Base path:

```text
/decision/v1
```

---

### 8.1 프로모션 분석 생성

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

`focus_segment_ids`는 next-loop에서 실패 세그먼트만 다시 분석할 때 사용한다.

---

### 8.2 콘텐츠 생성

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

---

### 8.3 콘텐츠 상태 변경

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

---

### 8.4 promotion_run 및 세그먼트별 광고 실험 생성

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
      "ad_experiment_id": "ad_exp_banner_family_001",
      "segment_id": "seg_family_trip",
      "content_id": "content_banner_family_001",
      "content_option_id": "banner_family_option_001",
      "status": "planned"
    }
  ]
}
```

---

### 8.5 active contents 조회

Dashboard 광고 실행 모듈이 실행할 콘텐츠를 조회한다.

```http
GET /decision/v1/promotion-runs/{promotion_run_id}/active-contents
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "channel": "onsite_banner",
  "ad_experiments": [
    {
      "ad_experiment_id": "ad_exp_banner_family_001",
      "segment_id": "seg_family_trip",
      "content_id": "content_banner_family_001",
      "content_option_id": "banner_family_option_001",
      "title": "아이와 함께 떠나는 여름 가족 호캉스",
      "body": "가족 여행객이 많이 찾는 숙소를 여름 특가로 만나보세요.",
      "cta": "가족 숙소 보기"
    }
  ]
}
```

---

### 8.6 유저-세그먼트 매칭

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/segment-match
```

Request:

```json
{
  "project_id": "hotel-client-a",
  "user_id": "user_123"
}
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "user_id": "user_123",
  "matched_segment_id": "seg_family_trip",
  "ad_experiment_id": "ad_exp_banner_family_001",
  "content_id": "content_banner_family_001",
  "content_option_id": "banner_family_option_001",
  "similarity_score": 0.812,
  "fallback": false
}
```

광고 실행 모듈은 이 응답의 `ad_experiment_id`, `segment_id`, `content_id`, `content_option_id`를 이벤트에 반드시 넣는다.

---

### 8.7 세그먼트 광고 실험 평가

단일 광고 실험 평가:

```http
POST /decision/v1/ad-experiments/{ad_experiment_id}/evaluate
```

Response:

```json
{
  "evaluation_id": "eval_ad_exp_family_001",
  "ad_experiment_id": "ad_exp_banner_family_001",
  "promotion_run_id": "run_banner_001",
  "promotion_id": "promo_banner_001",
  "segment_id": "seg_family_trip",
  "metric": "booking_conversion_rate",
  "target_value": 0.03,
  "actual_value": 0.024,
  "sample_size": 1800,
  "status": "goal_not_met",
  "next_loop_required": true,
  "feedback": "가족 여행 고객군은 목표 전환율에 도달하지 못했습니다."
}
```

promotion_run 전체 평가:

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
      "ad_experiment_id": "ad_exp_banner_family_001",
      "segment_id": "seg_family_trip",
      "actual_value": 0.024,
      "status": "goal_not_met"
    },
    {
      "ad_experiment_id": "ad_exp_banner_mobile_001",
      "segment_id": "seg_mobile_user",
      "actual_value": 0.034,
      "status": "goal_met"
    }
  ],
  "next_loop_required": true,
  "failed_segment_ids": ["seg_family_trip"],
  "failed_ad_experiment_ids": ["ad_exp_banner_family_001"]
}
```

---

### 8.8 다음 루프 생성

실패한 세그먼트 광고 실험에 대해 다음 루프를 만든다.

```http
POST /decision/v1/promotion-runs/{promotion_run_id}/next-loop
```

Request:

```json
{
  "failed_segment_ids": ["seg_family_trip"],
  "failed_ad_experiment_ids": ["ad_exp_banner_family_001"],
  "operator_instruction": "무료 취소보다 조식 포함과 수영장 혜택을 더 강조해줘."
}
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
      "ad_experiment_id": "ad_exp_banner_family_002",
      "segment_id": "seg_family_trip",
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
```

---

## 9. Dashboard 화면 계약

### 9.1 계층 표시

Dashboard는 항상 아래 계층을 보여준다.

```text
캠페인
→ 프로모션
→ 세그먼트
→ 광고 실험
```

추천 UI 문구:

```text
캠페인 목록
캠페인 상세
프로모션 목록/생성
프로모션별 세그먼트
세그먼트별 광고 콘텐츠
세그먼트별 광고 실험 상태
세그먼트별 실험 결과
다음 루프 생성
```

---

### 9.2 실험 생성 / 콘텐츠 검수 페이지

화면은 프로모션 단위로 열리지만, 내부는 세그먼트별로 나뉜다.

```text
Promotion: 내부 사이트 배너

Segment Card: 가족 여행 고객
- AI 분석 결과
- 콘텐츠 후보 3개
- 승인할 콘텐츠 선택
- 광고 실험 생성 상태

Segment Card: 모바일 탐색 고객
- AI 분석 결과
- 콘텐츠 후보 3개
- 승인할 콘텐츠 선택
- 광고 실험 생성 상태
```

MVP 필수:

```text
세그먼트별 승인 콘텐츠는 1개만 선택 가능
```

---

### 9.3 실험 상태 / 결과 페이지

표시 단위는 세그먼트별 광고 실험이다.

```text
Campaign: 여름 특가 세일
Promotion: 내부 사이트 배너

Segment: 가족 여행 고객
Ad Experiment: ad_exp_banner_family_001
Status: goal_not_met
Actual: 2.4%
Target: 3.0%
Action: 다음 루프 생성

Segment: 모바일 탐색 고객
Ad Experiment: ad_exp_banner_mobile_001
Status: goal_met
Actual: 3.4%
Target: 3.0%
Action: 종료
```

목표 미달 카드에는 optional 입력창을 둔다.

```text
관리자 추가 지침 optional:
[ 무료 취소보다 조식 포함을 강조해줘 ]
```

---

## 10. Dashboard 광고 실행 계약

### 10.1 banner resolve

```http
GET /api/ad/v1/banner/resolve?project_id=hotel-client-a&promotion_run_id=run_banner_001&user_id=user_123&placement_id=home_top
```

처리 순서:

```text
1. AI Decision active-contents 조회
2. AI Decision segment-match 호출
3. 응답의 ad_experiment_id 확인
4. 해당 segment의 active content 반환
5. promotion_impression 이벤트 전송
```

Response:

```json
{
  "promotion_run_id": "run_banner_001",
  "ad_experiment_id": "ad_exp_banner_family_001",
  "segment_id": "seg_family_trip",
  "content_id": "content_banner_family_001",
  "content_option_id": "banner_family_option_001",
  "title": "아이와 함께 떠나는 여름 가족 호캉스",
  "body": "가족 여행객이 많이 찾는 숙소를 여름 특가로 만나보세요.",
  "cta": "가족 숙소 보기",
  "target_url": "https://demo-stay.example.com/summer?family=true"
}
```

---

### 10.2 redirect link

email/sms 발송 시 redirect link에는 아래를 저장한다.

```text
redirect_id
promotion_run_id
ad_experiment_id
segment_id
content_id
content_option_id
user_id
target_url
```

redirect click 이벤트에도 같은 값을 포함한다.

---

## 11. PostgreSQL DDL 수정 계약

v1.3 대비 핵심 변경:

```text
1. ad_experiments 테이블 추가
2. promotion_evaluations에 ad_experiment_id 추가
3. ad_dispatch_jobs에 ad_experiment_id nullable 추가
4. redirect_links에 ad_experiment_id 추가
5. user_segment_assignments에 ad_experiment_id 추가
6. 같은 promotion_run_id + segment_id 조합의 ad_experiment는 1개만 허용
```

---

### 11.1 ad_experiments

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

    CONSTRAINT fk_ad_experiments_promotion_run
        FOREIGN KEY (promotion_run_id) REFERENCES promotion_runs (promotion_run_id),

    CONSTRAINT fk_ad_experiments_content
        FOREIGN KEY (content_id) REFERENCES content_candidates (content_id),

    CONSTRAINT chk_ad_experiments_channel
        CHECK (channel IN ('email', 'sms', 'onsite_banner')),

    CONSTRAINT chk_ad_experiments_status
        CHECK (status IN (
            'planned',
            'approved',
            'running',
            'evaluating',
            'goal_met',
            'goal_not_met',
            'insufficient_data',
            'stopped'
        )),

    CONSTRAINT chk_ad_experiments_goal_metric
        CHECK (goal_metric IN ('inflow_rate', 'booking_conversion_rate')),

    CONSTRAINT chk_ad_experiments_goal_basis
        CHECK (goal_basis IN ('promotion_average', 'all_segments')),

    CONSTRAINT uq_ad_experiments_segment_per_run
        UNIQUE (promotion_run_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_experiments_promotion_run_id
ON ad_experiments (promotion_run_id);

CREATE INDEX IF NOT EXISTS idx_ad_experiments_segment_id
ON ad_experiments (segment_id);

CREATE INDEX IF NOT EXISTS idx_ad_experiments_status
ON ad_experiments (status);
```

---

### 11.2 promotion_evaluations 변경

기존 `promotion_evaluations`에 아래 컬럼을 추가한다.

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

단, 기존 데이터 마이그레이션 때문에 FK 추가가 부담되면 MVP에서는 FK 없이 index만 먼저 둔다.

---

### 11.3 user_segment_assignments 변경

```sql
ALTER TABLE user_segment_assignments
ADD COLUMN IF NOT EXISTS ad_experiment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_user_segment_assignments_ad_experiment_id
ON user_segment_assignments (ad_experiment_id);
```

의미:

```text
promotion_run_id + user_id
→ segment_id
→ ad_experiment_id
```

---

### 11.4 ad_dispatch_jobs 변경

```sql
ALTER TABLE ad_dispatch_jobs
ADD COLUMN IF NOT EXISTS ad_experiment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_ad_dispatch_jobs_ad_experiment_id
ON ad_dispatch_jobs (ad_experiment_id);
```

email/sms를 세그먼트별로 따로 dispatch job으로 나누는 경우 사용한다.

---

### 11.5 redirect_links 변경

```sql
ALTER TABLE redirect_links
ADD COLUMN IF NOT EXISTS ad_experiment_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_redirect_links_ad_experiment_id
ON redirect_links (ad_experiment_id);
```

---

### 11.6 content_candidates 승인 제약

MVP에서는 같은 세그먼트에서 승인 콘텐츠가 1개만 있어야 한다.

PostgreSQL partial unique index를 사용할 수 있다.

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_content_candidates_one_approved_per_segment
ON content_candidates (generation_id, segment_id)
WHERE status = 'approved';
```

주의:

```text
segment_id가 NULL인 기본 콘텐츠를 허용하려면 별도 정책이 필요하다.
MVP에서는 세그먼트별 콘텐츠 생성을 기본으로 하므로 segment_id는 NOT NULL에 가깝게 운영한다.
```

---

## 12. ClickHouse DDL 수정 계약

v1.3 대비 핵심 변경:

```text
promotion_touch_events에 ad_experiment_id 추가
booking_outcome_events에 ad_experiment_id 추가
raw_events properties_json에도 ad_experiment_id 필수 포함
```

---

### 12.1 promotion_touch_events 변경

```sql
ALTER TABLE promotion_touch_events
ADD COLUMN IF NOT EXISTS ad_experiment_id String AFTER promotion_run_id;
```

정렬 키까지 바꾸는 것은 비용이 크므로 MVP에서는 컬럼만 추가한다.

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

---

### 12.2 booking_outcome_events 변경

```sql
ALTER TABLE booking_outcome_events
ADD COLUMN IF NOT EXISTS ad_experiment_id Nullable(String) AFTER promotion_run_id;
```

---

### 12.3 Materialized View 추출 변경

`raw_events`에서 typed table로 추출할 때 아래 key를 추가한다.

```sql
JSONExtractString(properties_json, 'ad_experiment_id') AS ad_experiment_id
```

예시:

```sql
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_raw_to_promotion_touch_events_v14
TO promotion_touch_events AS
SELECT
    event_time,
    event_name,
    project_id,
    JSONExtractString(properties_json, 'campaign_id') AS campaign_id,
    JSONExtractString(properties_json, 'promotion_id') AS promotion_id,
    JSONExtractString(properties_json, 'promotion_run_id') AS promotion_run_id,
    JSONExtractString(properties_json, 'ad_experiment_id') AS ad_experiment_id,
    user_id,
    session_id,
    JSONExtractString(properties_json, 'segment_id') AS segment_id,
    JSONExtractString(properties_json, 'promotion_channel') AS channel,
    JSONExtractString(properties_json, 'content_id') AS content_id,
    JSONExtractString(properties_json, 'content_option_id') AS content_option_id,
    source,
    nullIf(JSONExtractString(properties_json, 'redirect_id'), '') AS redirect_id,
    nullIf(JSONExtractString(properties_json, 'placement_id'), '') AS placement_id,
    nullIf(JSONExtractString(properties_json, 'landing_url'), '') AS landing_url,
    nullIf(JSONExtractString(properties_json, 'target_url'), '') AS target_url,
    properties_json
FROM raw_events
WHERE event_name IN (
    'promotion_impression',
    'promotion_click',
    'campaign_redirect_click',
    'campaign_landing'
);
```

---

### 12.4 세그먼트 광고 실험 평가 쿼리

email/sms inflow_rate:

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

onsite_banner booking_conversion_rate:

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

---

## 13. 현재 레포 기준 PR 수정 순서

### Phase 1. Data Source Contract

```text
1. ad_experiments 테이블 추가
2. promotion_evaluations에 ad_experiment_id 추가
3. user_segment_assignments에 ad_experiment_id 추가
4. redirect_links에 ad_experiment_id 추가
5. ad_dispatch_jobs에 ad_experiment_id 추가
6. ClickHouse promotion_touch_events / booking_outcome_events에 ad_experiment_id 추가
```

---

### Phase 2. AI Decision

```text
1. ad_experiment 도메인/DTO 추가
2. promotion_run 생성 시 세그먼트별 ad_experiment 생성
3. active-contents 응답에 ad_experiment_id 포함
4. segment-match 응답에 ad_experiment_id 포함
5. evaluation을 ad_experiment_id 기준으로 계산
6. next-loop에서 failed_segment_ids / failed_ad_experiment_ids만 재분석/재생성
7. operator_instruction optional 처리
```

---

### Phase 3. Dashboard

```text
1. 화면 계층을 Campaign → Promotion → Segment → Ad Experiment로 표시
2. 실험 생성 페이지에서 세그먼트별 콘텐츠 후보 표시
3. 세그먼트별 승인 콘텐츠 1개 선택
4. 세그먼트별 광고 실험 상태 카드 표시
5. 목표 미달 세그먼트에 관리자 추가 지침 입력창 추가
6. next-loop 생성 시 operator_instruction 전달
```

---

### Phase 4. Dashboard 광고 실행 모듈

```text
1. banner resolve 응답에 ad_experiment_id 포함
2. redirect_links 생성 시 ad_experiment_id 저장
3. 모든 실행 이벤트에 ad_experiment_id 포함
4. promotion_impression/promotion_click/campaign_redirect_click/campaign_landing/booking_complete에 ad_experiment_id 유지
```

---

### Phase 5. 수집/SDK

```text
1. event properties validation에 ad_experiment_id 추가
2. 프로모션 관련 이벤트에서 ad_experiment_id 누락 시 validation error
3. ClickHouse typed table 적재 시 ad_experiment_id 추출
```

---

## 14. Golden Scenario v1.4

### 14.1 입력

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

---

### 14.2 AI 생성

```text
Promotion 2: onsite_banner

AI 분석 결과 세그먼트:
- 가족 여행 고객
- 모바일 탐색 고객
- 체크인 임박 고객

AI 생성 결과:
각 세그먼트별 콘텐츠 후보 3개
```

관리자는 세그먼트별로 콘텐츠 1개씩 승인한다.

---

### 14.3 광고 실험 생성

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
```

---

### 14.4 평가

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
```

---

### 14.5 next-loop

관리자가 optional 지침을 입력한다.

```text
가족 여행 고객:
무료 취소보다 조식 포함과 수영장 혜택을 강조해줘.

체크인 임박 고객:
오늘 예약 가능, 즉시 확정 문구를 더 강하게 써줘.
```

AI Decision은 실패 세그먼트만 다시 루프를 만든다.

```text
run_banner_002
├── ad_exp_banner_family_002
└── ad_exp_banner_near_checkin_002
```

모바일 탐색 고객은 이미 목표를 달성했으므로 재실험하지 않는다.

---

## 15. 개발 체크리스트 v1.4

```text
[ ] 화면 계층이 Campaign → Promotion → Segment → Ad Experiment인가?
[ ] 프로모션별로 세그먼트가 생성되는가?
[ ] 세그먼트별로 광고 실험이 1개씩 생성되는가?
[ ] 같은 promotion_run_id + segment_id에 ad_experiment가 2개 이상 생기지 않는가?
[ ] promotion_run_id는 루프 묶음이고 ad_experiment_id가 실제 광고 실험 ID인가?
[ ] 콘텐츠 후보는 여러 개 생성하되 세그먼트별 승인 콘텐츠는 1개인가?
[ ] active contents 응답에 ad_experiment_id가 포함되는가?
[ ] segment-match 응답에 ad_experiment_id가 포함되는가?
[ ] 모든 프로모션 이벤트 properties에 ad_experiment_id가 포함되는가?
[ ] 평가는 ad_experiment_id 기준으로 가능한가?
[ ] 목표 미달 시 failed_segment_ids / failed_ad_experiment_ids만 next-loop 대상인가?
[ ] operator_instruction은 optional인가?
[ ] operator_instruction이 있으면 다음 분석/생성 prompt에 반영되는가?
[ ] 목표 달성 세그먼트는 재실험하지 않는가?
```

---

## 16. AI에게 개발 지시할 때 추가할 문장

팀원이 AI에게 개발을 시킬 때 v1.4부터 아래 문장을 반드시 추가한다.

```text
우리 서비스 계층은 Campaign → Promotion → Segment → Ad Experiment다.
Promotion Run은 프로모션의 n번째 루프를 묶는 내부 그룹이고,
실제 광고 실험 단위는 ad_experiment_id다.
MVP에서는 같은 promotion_run_id 안에서 segment_id당 ad_experiment를 1개만 생성한다.
콘텐츠 후보는 여러 개 생성할 수 있지만, 세그먼트별 승인 콘텐츠는 1개만 실험에 사용한다.
목표 미달 세그먼트만 optional operator_instruction을 받아 분석 → 생성 → 실험 루프를 다시 돈다.
```

# Dashboard Context

## 역할

`loop-ad_dashboard`는 Dashboard web client, Dashboard API server, Ads serve API를 포함하는
서비스 repository다. Dashboard Web은 프로젝트를 최상위 작업 공간으로 두고 캠페인,
프로모션, 세그먼트, 광고 실험을 계층적으로 조회하고 관리한다.

Dashboard Web의 주요 화면 구조:

```text
프로젝트
└── 캠페인 목록
    └── 캠페인 상세
        ├── 마케팅 기획
        ├── 실시간 추이
        ├── 워크플로우 View
        └── 프로모션 목록
            └── 프로모션 상세
                ├── 세그먼트 목록
                ├── 세그먼트 탭
                └── 실시간 추이
```

프로모션 상세는 여러 세그먼트를 탭 형태의 작업 단위로 열어 관리할 수 있어야 한다. 각
세그먼트 탭은 세그먼트 요약, 실시간 지표, 집계, 퍼널, SMS/Email 발송 상태, 배너
조회/클릭률을 함께 보여준다.

## 하지 않는 일

- Dashboard/Ads request path에서 AI Decision을 직접 호출하지 않는다.
- 외부 DB/API 실패를 mock success로 숨기지 않는다.
- 세그먼트를 캠페인 전체에 고정된 전역 타겟으로 취급하지 않는다.
- AI 생성 결과를 반드시 독립된 페이지로만 노출해야 한다고 가정하지 않는다.

## 공개 인터페이스

- Dashboard API endpoints.
- Ads serve API endpoints.
- Web client routes for project, campaign list/detail, promotion list/detail, segment detail,
  workflow view, and settings/SDK.
- Shared API/dashboard/ads types.

## Dashboard 조회 화면

- 프로젝트와 캠페인 목록은 캠페인 생성, 검색/필터, 상태 확인, 캠페인 상세 진입을 제공한다.
- 캠페인 상세는 캠페인 요약, 마케팅 기획, 캠페인 실시간 추이, 워크플로우 View, 프로모션
  목록, 다음 액션을 함께 보여준다.
- 캠페인 실시간 추이는 지표, 집계, 프로모션 집계로 나누어 표시한다.
- 프로모션 목록은 프로모션 상태, 프로모션별 세그먼트 요약, 프로모션 상세 진입, 세그먼트
  상세 진입을 제공한다.
- 프로모션 상세는 프로모션 요약, 세그먼트 목록, 실시간 추이, 퍼널, 세그먼트 집계를
  보여준다.
- 세그먼트 상세는 세그먼트 요약, 조건 요약, 대상 규모, sample size 검증, 연결된
  ad_experiment, 생성 콘텐츠, 생성 이유, 데이터 근거, 실시간 추이를 보여준다.
- 설정 / SDK 화면은 project_id, write_key 또는 sdk_key, domain, SDK script, 도메인 연동
  상태, 최근 이벤트 수집 시간, 수집 이벤트 목록을 보여준다.

## 의존 서비스

- 읽기: PostgreSQL contract DB, ClickHouse event store.
- 사용처: `loop-ad_demo-shoppingmall_front`, `loop-ad_advertisement_sdk`.

## 관련 workflow

- [../workflows/dashboard-read.md](../workflows/dashboard-read.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-DASHBOARD-001`
- `RULE-AD-001`
- `RULE-DASHBOARD-009`
- `RULE-DASHBOARD-010`
- `RULE-DASHBOARD-011`
- `RULE-DASHBOARD-012`
- `RULE-SERVICE-003`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

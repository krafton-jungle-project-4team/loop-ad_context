# Domain Model

LoopAd는 사용자 행동 이벤트를 수집하고, 행동 데이터를 분석해 고객군과 마케팅 액션을
생성한 뒤, 광고/대시보드 경로에서 그 결과를 읽어 사용하는 시스템이다.

## Core Flow

1. Event SDK가 브라우저에서 사용자 행동 이벤트를 만든다.
2. Event Collector가 SDK payload를 검증하고 Kafka raw topic으로 원문 JSON을 발행한다.
3. ClickHouse가 raw event를 분석 가능한 이벤트 테이블로 저장한다.
4. AI Decision이 ClickHouse 이벤트를 읽어 segment, recommendation, content, experiment 결과를 만든다.
5. AI Decision은 결과를 PostgreSQL contract DB에 쓴다.
6. Dashboard API와 Ads serving API는 AI Decision을 직접 호출하지 않고 contract DB와 ClickHouse를 읽는다.
7. Demo front는 Event SDK와 Advertisement SDK를 통해 수집과 광고 노출 흐름을 검증한다.

## User-Facing Hierarchy

LoopAd의 사용자-facing 계층은 아래 구조를 따른다.

```text
Campaign
└── Promotion
    └── Segment
        └── Ad Experiment
```

- Campaign은 큰 마케팅 기획 단위다.
- Promotion은 캠페인 안의 채널별 실행 단위다.
- Segment는 해당 프로모션에서 타겟팅할 고객군이다.
- Ad Experiment는 특정 세그먼트에 대해 실제로 실행되는 광고 실험이다.

세그먼트는 캠페인 전체에 고정하지 않고 프로모션별로 생성되거나 사용자가 정의한다.
광고 실험은 세그먼트별로 생성되며, 같은 `promotion_run_id` 안에서 `segment_id`당
`ad_experiment_id`는 하나만 존재한다.

## Dashboard Workspace

Dashboard Web은 프로젝트를 최상위 작업 공간으로 두고, 캠페인 목록에서 캠페인 상세로,
캠페인 상세에서 마케팅 기획, 실시간 추이, 워크플로우 View, 프로모션 목록을 탐색한다.
프로모션 상세는 세그먼트 목록과 세그먼트별 실시간 지표를 함께 보여주며, 여러 세그먼트를
탭 형태의 작업 단위로 열어 프로모션 전체 지표와 비교할 수 있다.

## Boundary

서비스별 세부 책임은 [../services](../services)를 본다. 여러 서비스가 엮이는 흐름은
[../workflows](../workflows)를 본다.

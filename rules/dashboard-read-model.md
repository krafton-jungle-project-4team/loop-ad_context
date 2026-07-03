# Dashboard Read Model Rules

이 문서는 Dashboard의 조회, ChatKit, segment query 책임에 관한 느슨한 문구 묶음이다.
세부 endpoint schema는 각 service repository와 공통 계약 문서를 따른다.

## RULE-DASHBOARD-001

Dashboard API는 UI 조회와 광고 실행 판단을 위해 PostgreSQL contract DB와 ClickHouse를
읽는다. 단순 조회를 최신화하려고 Decision API를 반복 호출하지 않는다.

## RULE-DASHBOARD-002

Dashboard는 외부 DB/API 실패를 mock success나 fallback 데이터로 숨기지 않는다. 실패는
사용자와 운영자가 볼 수 있는 오류 상태로 드러낸다.

## RULE-DASHBOARD-003

Dashboard Web client는 API 응답을 화면에 표시하고 사용자 action을 전달한다. 분석,
생성, 평가 job을 브라우저에서 직접 실행하지 않는다.

## RULE-DASHBOARD-004

자연어 세그먼트 조회, SQL preview, 사용자 정의 세그먼트 저장, ChatKit session/action,
funnel definition 저장은 Dashboard API 책임이다.

## RULE-DASHBOARD-005

AI가 만든 segment SQL은 바로 write로 연결하지 않는다. Dashboard API는 preview를 만들고
`SELECT` 또는 `WITH SELECT`, `project_id` 조건, `LIMIT`, timeout 같은 안전 조건을 확인한
뒤 사용자가 저장을 확정할 때만 segment definition으로 저장한다.

## RULE-DASHBOARD-006

ChatKit write성 action은 사용자 확인 후 실행한다. Dashboard Web에는 OpenAI API key를
노출하지 않고, 필요한 경우 server가 발급한 client secret만 전달한다.

## RULE-DASHBOARD-007

Dashboard가 Decision API를 호출할 수 있는 경우는 promotion analysis, content generation,
promotion_run/ad_experiment 생성, segment assignment build, evaluation, next-loop 같은
생명주기 이벤트에 한정한다.

## RULE-DASHBOARD-008

호텔 예약 funnel은 기본 fixture를 제공할 수 있지만 하드코딩된 유일한 funnel로 취급하지
않는다. Dashboard에서 project, promotion, channel에 맞게 수정 가능한 정의로 관리한다.

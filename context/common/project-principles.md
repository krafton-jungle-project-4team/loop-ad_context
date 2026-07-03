# Project Principles

이 문서는 LoopAd 전체에서 반복 적용되는 큰 원칙을 기록한다. 세부 구현 설명은 서비스별
context와 workflow context에 둔다.

## Principles

- 기본 구현 기준은 사용하는 GitHub repository의 `origin/main`이다.
- local path는 사용자가 명시한 경우에만 개발 중 변경 비교 대상으로 본다.
- 사용자-facing 계층은 Campaign → Promotion → Segment → Ad Experiment로 고정한다.
- 세그먼트는 캠페인 전체가 아니라 프로모션별로 생성되거나 사용자가 정의한다.
- Dashboard Web은 프로젝트를 최상위 작업 공간으로 두고 캠페인 상세, 프로모션 상세,
  세그먼트 상세를 계층적으로 탐색한다.
- 프로모션 상세는 여러 세그먼트를 탭 형태의 작업 단위로 열어 세그먼트별 지표와
  프로모션 전체 지표를 비교할 수 있어야 한다.
- Dashboard API와 Ads serving API는 AI Decision을 요청 경로에서 직접 호출하지 않는다.
- ClickHouse는 raw event source를 유지한다.
- PostgreSQL contract DB는 AI Decision 결과를 Dashboard/Ads serving과 공유하는 읽기 계약이다.
- 외부 DB/API 실패를 mock success나 fallback 데이터로 숨기지 않는다.
- 브라우저 SDK는 Kafka, ClickHouse, AWS secret에 직접 접근하지 않는다.
- 통합 환경 검증은 각 서비스의 로컬 실행 조합이 아니라 현재 배포된 dev 서버 환경을 기준으로
  본다.
- deployable service와 frontend는 각 repository의 `main` branch 변경이 dev 환경 CI/CD의
  기준이다.
- 현재 LoopAd는 실제 고객 production data가 아니라 테스트 데이터와 공개 데이터셋 기반으로
  검증하는 프로젝트다.
- schema, payload, seed, contract 변경 시 기존 더미 데이터를 보존하는 것보다 DB,
  ClickHouse, Kafka topic을 초기화하거나 더미 값으로 덮어쓴 뒤 재적재/재생성하는 전략을
  적극적으로 권장할 수 있다.
- archived repo와 과거 과제용 repo는 현재 제품 판단 근거로 삼지 않는다.

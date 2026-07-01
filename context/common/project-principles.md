# Project Principles

이 문서는 LoopAd 전체에서 반복 적용되는 큰 원칙을 기록한다. 세부 구현 설명은 서비스별
context와 workflow context에 둔다.

## Principles

- 기본 구현 기준은 사용하는 GitHub repository의 `origin/main`이다.
- local path는 사용자가 명시한 경우에만 개발 중 변경 비교 대상으로 본다.
- Dashboard API와 Ads serving API는 AI Decision을 요청 경로에서 직접 호출하지 않는다.
- ClickHouse는 raw event source를 유지한다.
- PostgreSQL contract DB는 AI Decision 결과를 Dashboard/Ads serving과 공유하는 읽기 계약이다.
- 외부 DB/API 실패를 mock success나 fallback 데이터로 숨기지 않는다.
- 브라우저 SDK는 Kafka, ClickHouse, AWS secret에 직접 접근하지 않는다.
- archived repo와 과거 과제용 repo는 현재 제품 판단 근거로 삼지 않는다.

## TODO

- 운영 배포 후 production-only 원칙과 demo-only 예외를 분리한다.


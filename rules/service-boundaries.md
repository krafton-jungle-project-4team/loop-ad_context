# Service Boundaries Rules

이 문서는 Loop-Ad 서비스 책임 경계에 관한 느슨한 문구 묶음이다. schema나 endpoint
명세의 원본으로 쓰지 않고, context 평가 시 의미 판단의 기준으로 사용한다.

## RULE-SERVICE-001

브라우저 SDK와 frontend bundle은 backend data store, Kafka, AWS secret, server-only
token에 직접 접근하지 않는다.

## RULE-SERVICE-002

Event Collector는 이벤트 envelope와 프로모션 필수 property를 검증하고 raw event를
pipeline에 넘기는 수집 경계다. ClickHouse 적재, 분석용 view, campaign 판단은 Collector
책임으로 설명하지 않는다.

## RULE-SERVICE-003

Dashboard API의 단순 조회, 광고 실행 hot path, ChatKit segment preview, 사용자 정의
세그먼트 저장은 Decision API를 동기 호출하지 않는다.

## RULE-SERVICE-004

현재 제품 판단은 registry의 "사용하는 것"에 있는 repository만 기준으로 한다. registry의
"사용하지 않는 것"에 있는 archived, generated, 과거 과제용 repository는 구현 계약 판단의
근거로 삼지 않는다.

## RULE-SERVICE-005

Decision은 분석, 생성, 세그먼트 매칭 배치, 평가, next-loop 결과를 DB에 저장하는 엔진이다.
Dashboard는 사용자 UI, ChatKit, segment query, 광고 실행, DB 조회를 담당한다.

## RULE-SERVICE-006

Data Source Contract는 PostgreSQL과 ClickHouse의 공유 schema 계약을 관리한다. 각 서비스
repository는 자기 편의를 위해 공통 `schema.sql`을 중복 생성하지 않는다.

## RULE-SERVICE-007

`advertisement-api`는 별도 dev 인프라 대상 서비스로 설명하지 않는다. 광고 실행 API는
Dashboard API 내부 모듈로 본다.

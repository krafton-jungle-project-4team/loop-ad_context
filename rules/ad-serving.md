# Ad Serving Rules

이 문서는 Dashboard 광고 실행 hot path에 관한 느슨한 문구 묶음이다. request/response
schema의 원본으로 쓰지 않는다.

## RULE-AD-001

광고 실행 API는 Decision을 직접 실행하지 않고 PostgreSQL contract DB에 저장된
`promotion_run`, `ad_experiment`, content, assignment 결과를 읽는다.

## RULE-AD-002

Advertisement SDK는 광고 소재 요청과 렌더링을 담당한다. 세그먼트 매칭, 추천 계산,
실험 평가를 브라우저에서 수행하지 않는다.

## RULE-AD-003

광고 노출, 클릭, redirect, landing tracking은 Event SDK와 Event Collector의 호텔 이벤트
수집 흐름으로 이어져야 한다.

## RULE-AD-004

Banner resolve는 `promotion_run_id`와 `user_id` 기준 assignment를 조회해 segment,
ad_experiment, content를 복원한다. 사용자를 찾지 못해 fallback을 쓰더라도 Decision API를
동기 호출하지 않는다.

## RULE-AD-005

Email/SMS dispatch는 이미 저장된 assignment와 content를 사용해 발송 대상과 redirect link를
만든다. 발송 시점에 세그먼트를 새로 계산하지 않는다.

## RULE-AD-006

Redirect 처리는 redirect identifier에서 campaign, promotion, promotion_run,
ad_experiment, segment, content, user 정보를 복원하고 `campaign_redirect_click` 이벤트로
연결한다.

## RULE-AD-007

광고 실행과 평가에 필요한 프로모션 이벤트에는 `ad_experiment_id`가 포함되어야 한다.
`promotion_run_id`만으로 세그먼트별 광고 실험 결과를 합치지 않는다.

# AI Decision Rules

이 문서는 AI Decision의 생명주기 책임에 관한 느슨한 문구 묶음이다. Decision API schema의
원본으로 쓰지 않는다.

## RULE-AI-001

AI Decision은 ClickHouse의 호텔 행동 이벤트와 PostgreSQL의 campaign, promotion,
segment definition을 읽어 분석, 콘텐츠 생성, 세그먼트 매칭, 평가 결과를 만든다.

## RULE-AI-002

AI Decision은 결과를 PostgreSQL contract DB에 쓰고 online serving request path에 직접
참여하지 않는다.

## RULE-AI-003

manual/demo trigger가 있더라도 public serving API와 같은 책임으로 설명하지 않는다.

## RULE-AI-004

Decision API는 write-oriented lifecycle API만 제공한다. 자연어 SQL preview, 사용자 정의
세그먼트 저장, ChatKit session/action, Dashboard 단순 조회용 GET API는 Decision 책임이
아니다.

## RULE-AI-005

Decision은 promotion_run 하나에 대해 대상 segment 수만큼 ad_experiment를 만든다. 같은
`promotion_run_id + segment_id` 조합에는 ad_experiment가 하나만 있어야 한다.

## RULE-AI-006

세그먼트 매칭 결과 생성은 promotion_run 시작, segment 변경, 배치 갱신 시점에 수행한다.
광고 요청마다 Decision이 segment를 계산하지 않는다.

## RULE-AI-007

평가는 `ad_experiment_id` 기준으로 가능해야 한다. promotion_run 전체 평가는 세그먼트별
ad_experiment 평가를 합쳐 판단한다.

## RULE-AI-008

next-loop는 실패한 segment와 ad_experiment만 대상으로 만든다. 목표를 달성한 segment는 같은
loop에서 유지하고 재실험하지 않는다.

## RULE-AI-009

operator instruction은 next-loop 분석과 생성에 반영할 수 있는 optional input이다. instruction
없음은 next-loop 생성 실패 사유가 아니다.

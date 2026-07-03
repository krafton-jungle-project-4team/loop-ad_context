# Domain Lifecycle Rules

이 문서는 호텔 예약 도메인과 Campaign lifecycle에 관한 느슨한 문구 묶음이다. object schema나
status enum의 원본으로 쓰지 않는다.

## RULE-DOMAIN-001

사용자-facing 계층은 `Campaign -> Promotion -> Segment -> Ad Experiment`로 설명한다.
Segment를 campaign 전체에 고정하거나 ad experiment를 segment 밖에 독립된 실험으로 설명하지
않는다.

## RULE-DOMAIN-002

Segment는 promotion별로 생성되거나 사용자가 정의한다. Ad Experiment는 segment별로 생성되고,
MVP에서 한 ad_experiment는 하나의 승인 콘텐츠만 사용한다.

## RULE-DOMAIN-003

`promotion_run_id`는 promotion의 n번째 loop 묶음이고, `ad_experiment_id`는 특정 segment에서
실제로 진행되는 광고 실험 ID다.

## RULE-DOMAIN-004

공통 API와 화면에서 `arm_id`, `variant_id`, `creative_id`, `experiment_id`를 새 public ID로
사용하지 않는다. legacy 호환이 필요하면 내부 매핑으로 제한한다.

## RULE-DOMAIN-005

쇼핑몰 중심 개념은 호텔 예약 도메인으로 이관한다. `product`, `cart`, `purchase`, `ad_*`
event를 새 공통 도메인 언어로 되살리지 않는다.

## RULE-DOMAIN-006

Email/SMS의 기본 목표 지표는 유입 흐름을, onsite banner의 기본 목표 지표는 예약 전환 흐름을
기준으로 한다. 지표 판단은 promotion_run과 ad_experiment 단위로 추적 가능해야 한다.

## RULE-DOMAIN-007

사용자 정의 segment는 너무 작은 sample을 저장하지 않는다. 공통 기준은 최소 사용자 수와 최소
eligible 사용자 비율을 함께 만족하는지로 판단한다.

## RULE-DOMAIN-008

목표 미달 시 성공 segment는 유지하고 실패 segment만 다시 분석, 생성, 실험한다. max loop를
초과한 promotion은 계속 재시도하지 않고 중지 상태로 정리한다.

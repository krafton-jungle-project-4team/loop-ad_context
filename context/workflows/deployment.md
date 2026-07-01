# Deployment Workflow

## 목적

LoopAd 서비스의 배포와 public domain/env contract를 일관되게 관리한다.

## 참여 서비스

- `loop-ad_infra`
- `loop-ad_event_sdk`
- `loop-ad_advertisement_sdk`
- `loop-ad_event_collector`
- `loop-ad_dashboard`
- `loop-ad_demo-shoppingmall_front`
- `loop-ad_decision`

## 흐름

1. Infra repo가 AWS resource와 public domain contract를 관리한다.
2. 각 service repo는 자기 build/test/publish workflow를 관리한다.
3. Deployable services는 infra의 reusable workflow나 role/env contract를 따른다.
4. SDK repos는 package/bundle publish contract를 따른다.

## 관련 rule

- `RULE-ENV-001`
- `RULE-ENV-002`

## TODO

- 각 repo별 deployment trigger와 required secrets/variables를 보강한다.


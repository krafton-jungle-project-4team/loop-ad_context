# Demo Shoppingmall Front Context

## 역할

`loop-ad_demo-shoppingmall_front`는 LoopAd SDK와 광고 serving 흐름을 실제 쇼핑몰 UI에서
검증하는 React/Vite 데모 프론트다.

## 하지 않는 일

- Event Collector endpoint 계약을 직접 소유하지 않는다.
- 광고 후보 생성이나 AI Decision 실행을 담당하지 않는다.

## 공개 인터페이스

- Demo shopping routes.
- Event SDK integration.
- Advertisement SDK integration.
- Local fallback ad rendering for demo UX.

## 의존 서비스

- 사용: `loop-ad_event_sdk`, `loop-ad_advertisement_sdk`.
- 호출: Dashboard Ads serve API.

## 관련 workflow

- [../workflows/event-ingestion.md](../workflows/event-ingestion.md)
- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-DEMO-001`
- `RULE-AD-002`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

## TODO

- 실제 ad slot, fallback tracking, SDK loader 규칙을 보강한다.


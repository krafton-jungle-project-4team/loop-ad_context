# Advertisement SDK Context

## 역할

`loop-ad_advertisement_sdk`는 광고 소재를 요청하고 지정한 화면 영역에 렌더링하는 브라우저 SDK다.

## 하지 않는 일

- AI Decision을 직접 호출하지 않는다.
- 광고 후보 생성이나 추천 계산을 브라우저에서 수행하지 않는다.

## 공개 인터페이스

- browser SDK bundle.
- 광고 지면을 렌더링하기 위한 public client API.
- Ads serve API 요청.

## 의존 서비스

- 읽기: `loop-ad_dashboard`의 Ads serve API.
- 사용처: `loop-ad_demo-shoppingmall_front`.

## 관련 workflow

- [../workflows/ad-serving.md](../workflows/ad-serving.md)

## 관련 rule

- `RULE-AD-001`
- `RULE-SERVICE-001`

## 로컬 검증

서비스 repo의 README/CONTRIBUTING을 기준으로 한다.

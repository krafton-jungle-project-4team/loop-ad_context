# Ad Serving Rules

## RULE-AD-001

Ads serve API는 AI Decision을 직접 실행하지 않고 PostgreSQL contract DB의 serving 가능한 결과를 읽는다.

## RULE-AD-002

Advertisement SDK는 광고 소재 요청과 렌더링을 담당하고 추천 계산을 브라우저에서 수행하지 않는다.

## RULE-AD-003

광고 노출과 클릭 tracking은 Event SDK의 이벤트 수집 흐름으로 이어져야 한다.


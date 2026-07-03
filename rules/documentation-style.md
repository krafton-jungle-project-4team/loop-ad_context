# Documentation Style Rules

이 문서는 context 저장소 문서 운영 방식에 관한 느슨한 문구 묶음이다.

## RULE-DOC-001

README.md는 사람용 소개와 운영 방법을 담당하고, AGENTS.md는 AI agent용 진입점과 평가
순서를 담당한다.

## RULE-DOC-002

service context는 단일 서비스 책임을 설명하고, workflow context는 여러 서비스가 엮인 흐름을
설명한다.

## RULE-DOC-003

rules 문서는 엄격한 schema나 contract parser 원본이 아니라 반복 인용할 느슨한 문구 묶음으로
관리한다.

## RULE-DOC-004

평가 결과는 사용자가 명시하지 않으면 파일로 생성하지 않고 대화 리포트로만 제공한다.

## RULE-DOC-005

공통 계약 판단은 `docs/reference_loop-ad-team-common-contract-v1.6-final.md`를 기준으로 한다.
older original reference는 이력 보관용이며 현재 규칙의 우선 기준이 아니다.

## RULE-DOC-006

rules에는 DB schema, endpoint request/response, repository 내부 구현 절차를 길게 복제하지
않는다. 그런 세부사항은 reference 문서, service context, 또는 해당 implementation repository
문서로 보낸다.

## RULE-DOC-007

context/rules의 cross-repo 규칙이 각 service repository에 동일한 문장으로 중복되지 않았다는
이유만으로 불일치로 판정하지 않는다. 구현, 공개 계약, 책임 경계가 실제로 충돌할 때
동기화 문제로 본다.

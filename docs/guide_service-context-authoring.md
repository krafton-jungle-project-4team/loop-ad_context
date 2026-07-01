# Service Context Authoring Guide

이 문서는 `context/services/*.md` 작성법을 설명한다.

## 작성 원칙

- 한 문서는 한 서비스만 설명한다.
- 서비스 간 end-to-end 흐름은 workflow context에 둔다.
- 확정된 구현/계약만 작성하고, 확인되지 않은 내용은 문서에 넣지 않는다.
- 현재 제품 판단은 `registry/services.md`의 "사용하는 것"만 기준으로 한다.

## 필수 섹션

- 역할
- 하지 않는 일
- 공개 인터페이스
- 의존 서비스
- 관련 workflow
- 관련 rule
- 로컬 검증

새 파일은 [template_service-context.md](template_service-context.md)를 복사해서 시작한다.

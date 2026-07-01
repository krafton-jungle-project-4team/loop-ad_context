# Workflow Context Authoring Guide

이 문서는 `context/workflows/*.md` 작성법을 설명한다.

## 작성 원칙

- 여러 서비스가 함께 만드는 흐름만 workflow context에 둔다.
- 단일 서비스 책임은 service context로 링크한다.
- 단계는 실제 데이터 흐름이나 호출 흐름 순서로 쓴다.
- 확실하지 않은 부분은 TODO로 남긴다.

## 필수 섹션

- 목적
- 참여 서비스
- 흐름
- 관련 rule

새 파일은 [template_workflow-context.md](template_workflow-context.md)를 복사해서 시작한다.


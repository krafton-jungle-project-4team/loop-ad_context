# AI Decision Rules

## RULE-AI-001

AI Decision은 ClickHouse raw event source를 읽어 segment, action, recommendation, content, experiment 결과를 만든다.

## RULE-AI-002

AI Decision은 결과를 PostgreSQL contract DB에 쓰고 online serving request path에 직접 참여하지 않는다.

## RULE-AI-003

manual/demo trigger가 있더라도 public serving API와 같은 책임으로 설명하지 않는다.


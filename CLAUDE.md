# sureNet - Claude Code 작업 규칙

## 프로젝트 개요
사내 네트워킹 및 유사도 기반 직원 매칭 서비스

## 작업 규칙

### 1. 단계 추적
- **phase.md** 파일로 개발 진행 상황 추적
- 작업 시작 전: phase.md 확인
- 작업 완료 후: phase.md 업데이트

### 2. 데이터베이스
- **항상 Supabase MCP 사용**
- 직접 SQL 실행 금지
- 마이그레이션은 `mcp__supabase__apply_migration` 사용
- 쿼리 실행은 `mcp__supabase__execute_sql` 사용

### 3. 코드 스타일
- TypeScript strict mode
- 한국어 UI 텍스트
- shadcn/ui 컴포넌트 사용
- Tailwind CSS v4

### 4. API 규칙
- `/api/*` 라우트에서 인증 확인 필수
- 에러 응답: `{ success: false, error: { code, message } }`
- 성공 응답: `{ success: true, data: {...} }`

### 5. 커밋 규칙
- feat: 새 기능
- fix: 버그 수정
- chore: 기타 작업

## 기술 스택
- Next.js 15 (App Router)
- Supabase (Auth, Database, Storage)
- OpenAI (text-embedding-3-small)
- React Flow (네트워크 시각화)
- Railway (배포)

## 환경 변수
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL
```

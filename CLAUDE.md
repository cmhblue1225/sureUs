# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

sureNet - 사내 네트워킹 및 유사도 기반 직원 매칭 서비스
- AI 기반 동료 추천 (OpenAI 임베딩 + 7요소 알고리즘)
- React Flow 네트워크 시각화
- 기수(Cohort) 기반 데이터 격리 시스템
- Anthropic Claude 통합 (프로필 어시스턴트, 검색 쿼리 확장)

## 개발 명령어

```bash
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint
```

## 작업 규칙

### 1. 진행 상황 추적
- **작업 전**: `phase.md` 파일 확인
- **작업 후**: `phase.md` 업데이트

### 2. 데이터베이스
- **Supabase MCP 도구만 사용**
- 마이그레이션: `mcp__supabase__apply_migration`
- 쿼리 실행: `mcp__supabase__execute_sql`
- 직접 SQL 파일 실행 금지

### 3. API 응답 형식
```typescript
// 성공
{ success: true, data: {...} }
// 에러
{ success: false, error: { code: string, message: string } }
```

### 4. 커밋 규칙
- `feat:` 새 기능
- `fix:` 버그 수정
- `chore:` 기타 작업

## 아키텍처

### 기술 스택
| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + pgvector + Realtime) |
| AI | OpenAI (text-embedding-3-small), Anthropic Claude |
| Visualization | @xyflow/react (React Flow) + d3-force |
| Deploy | Railway |

### 디렉토리 구조
```
src/
├── app/
│   ├── (main)/           # 인증 필요 라우트
│   │   ├── dashboard/
│   │   ├── network/      # 네트워크 시각화
│   │   ├── admin/        # 관리자 (기수/직원 관리)
│   │   └── ...
│   └── api/              # API 라우트
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── graph/            # 네트워크 시각화 컴포넌트
│   ├── admin/            # 관리자 컴포넌트
│   └── layout/           # Header, Sidebar
└── lib/
    ├── supabase/         # client.ts, server.ts, middleware.ts
    ├── openai/           # embeddings.ts
    ├── anthropic/        # profileAssistant.ts, queryExpansion.ts
    ├── matching/         # 7요소 매칭 알고리즘
    ├── graph/            # 레이아웃, 클러스터링
    └── constants/        # 부서, 직군, MBTI, 태그 상수
```

### 핵심 시스템

**매칭 알고리즘 (7요소)**
| 요소 | 가중치 | 파일 |
|------|--------|------|
| 임베딩 유사도 | 25% | `lib/matching/algorithm.ts` |
| 취미 태그 | 20% | Jaccard 유사도 |
| MBTI 궁합 | 15% | `lib/matching/mbtiCompatibility.ts` |
| 직군 유사도 | 15% | `lib/matching/jobRoleScoring.ts` |
| 부서 관계 | 10% | `lib/matching/departmentScoring.ts` |
| 지역 근접성 | 10% | `lib/matching/locationScoring.ts` |
| 선호도 | 5% | 사용자 설정 |

**기수(Cohort) 시스템**
- 모든 데이터는 `cohort_id`로 완전 격리
- 관리자는 기수 선택 후 해당 데이터만 접근 가능
- RLS 정책으로 보안 적용

**네트워크 시각화**
- Force-directed 레이아웃 (`lib/graph/forceLayout.ts`)
- 클러스터링 (`lib/graph/clustering.ts`)
- 의미 검색 시 관련도 기반 배치:
  - 동심원 영역: 최고 매칭(70%+, 300px), 높은 매칭(50-69%, 450px), 관련 있음(30-49%, 600px)
  - 결정적 레이아웃: `runSearchBasedForceLayout()` - 티어별 원형 배치
  - React Flow 노드는 좌상단 기준 배치 → 중심 맞춤 시 오프셋 필요 (-90px, -55px)

**조직 구조 (3단계)**
- 본부(Division) → 센터(Center) → 팀(Team)
- `lib/constants/organization.ts`에서 관리
- 부서 선택 시 상위 조직 자동 추론: `findOrgHierarchyByName()`

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL
```

## 주요 API 엔드포인트

| 경로 | 설명 |
|------|------|
| `/api/profile` | 프로필 CRUD (임베딩 자동 생성) |
| `/api/graph/network` | 네트워크 그래프 데이터 |
| `/api/graph/semantic-search` | 의미 기반 검색 |
| `/api/admin/cohorts` | 기수 관리 |
| `/api/admin/employees` | 직원 일괄 등록 |
| `/api/conversations` | 1:1 메시지 |
| `/api/announcements` | 공지사항 |
| `/api/board/posts` | 게시판 |
| `/api/calendar` | 일정 관리 |

## 데이터베이스 핵심 테이블

- `users` - 사용자 프로필 + `embedding vector(1536)`
- `cohorts` - 기수 정보
- `conversations` / `messages` - 1:1 메시지
- `announcements` - 공지사항
- `board_posts` / `board_comments` - 게시판
- `calendar_events` - 일정

## 인증 플로우

```
일반 사용자: /login → /onboarding (미완료 시) → /dashboard
관리자: /login → /admin/cohorts (기수 선택) → /dashboard
```
- 미들웨어: `lib/supabase/middleware.ts`
- 관리자 판별: `users.role = 'admin'`
- 기수 선택 상태: 쿠키 `selected_cohort_id`

## 코드 스타일

- TypeScript strict mode
- 한국어 UI 텍스트
- `@/*` 경로 별칭 사용
- API 라우트에서 인증 확인 필수

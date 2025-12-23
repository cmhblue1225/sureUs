# sureNet/sureUs 시스템 기술 문서

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [AI/ML 시스템](#4-aiml-시스템)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [주요 기능 모듈](#6-주요-기능-모듈)
7. [API 명세](#7-api-명세)
8. [보안 및 인증](#8-보안-및-인증)

---

## 1. 프로젝트 개요

### 1.1 서비스 소개
**sureNet (sureUs)**는 AI 기반 사내 네트워킹 및 동료 매칭 서비스입니다. 신입사원 온보딩과 사내 커뮤니케이션을 혁신적으로 개선하기 위해 설계되었습니다.

### 1.2 핵심 가치
- **AI 기반 동료 추천**: OpenAI 임베딩 + 7요소 매칭 알고리즘
- **네트워크 시각화**: React Flow 기반 인터랙티브 그래프
- **기수(Cohort) 기반 데이터 격리**: 완전한 멀티테넌시 지원
- **실시간 커뮤니케이션**: 1:1 메시지, 게시판, 공지사항

### 1.3 주요 기능
| 기능 | 설명 |
|------|------|
| 온보딩 시스템 | AI 어시스턴트가 도와주는 8단계 프로필 작성 |
| 네트워크 그래프 | Force-directed 레이아웃의 동료 관계 시각화 |
| 시맨틱 검색 | 자연어 기반 동료 검색 ("React 잘하는 외향적인 사람") |
| 얼굴 인식 | MediaPipe + FastAPI 기반 실시간 얼굴 인식 |
| AI 팀 편성 | Claude AI가 기준에 맞춰 팀 자동 구성 |
| 메시징 | 실시간 1:1 대화 시스템 |

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처
```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router (React 19)                               │
│  ├── Pages: Dashboard, Network, Profile, Admin, Messages...    │
│  ├── Components: shadcn/ui + Radix UI + Tailwind CSS v4        │
│  └── Visualization: React Flow (@xyflow/react) + d3-force      │
├─────────────────────────────────────────────────────────────────┤
│                        API Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                              │
│  ├── /api/profile/* - 프로필 CRUD + AI 생성                     │
│  ├── /api/graph/* - 네트워크 그래프 + 시맨틱 검색               │
│  ├── /api/admin/* - 관리자 기능 (기수/직원 관리)                │
│  ├── /api/face-recognition/* - 얼굴 인식                        │
│  └── /api/team-grouping/* - AI 팀 편성                          │
├─────────────────────────────────────────────────────────────────┤
│                        AI/ML Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   OpenAI     │  │  Anthropic   │  │   Face Recognition   │   │
│  │  Embeddings  │  │    Claude    │  │      (FastAPI)       │   │
│  │ text-embed-  │  │  claude-     │  │  sureus.railway.app  │   │
│  │ ding-3-small │  │  sonnet-4.5  │  │  + MediaPipe         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      Database Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL + pgvector)                               │
│  ├── Auth: 이메일/비밀번호 인증                                  │
│  ├── RLS: Row Level Security 정책                               │
│  ├── Realtime: 실시간 데이터 동기화                              │
│  └── Storage: 아바타, 첨부파일 저장                              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 디렉토리 구조
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 페이지 (login, signup)
│   ├── (main)/                   # 보호된 페이지 (인증 필요)
│   │   ├── dashboard/            # 대시보드
│   │   ├── network/              # 네트워크 시각화
│   │   ├── profile/              # 프로필 조회/편집
│   │   ├── admin/                # 관리자 패널
│   │   │   ├── cohorts/          # 기수 관리
│   │   │   └── employees/        # 직원 관리
│   │   ├── face-recognition/     # 얼굴 인식
│   │   ├── messages/             # 1:1 메시지
│   │   ├── announcements/        # 공지사항
│   │   ├── board/                # 게시판
│   │   └── calendar/             # 일정 관리
│   ├── onboarding/               # 온보딩 위자드
│   └── api/                      # API 라우트
├── components/
│   ├── ui/                       # shadcn/ui 컴포넌트
│   ├── graph/                    # 네트워크 시각화 컴포넌트
│   ├── onboarding/               # 온보딩 단계 컴포넌트
│   ├── face-recognition/         # 얼굴 인식 UI
│   └── layout/                   # Header, Sidebar
└── lib/
    ├── supabase/                 # Supabase 클라이언트
    ├── openai/                   # OpenAI 임베딩
    ├── anthropic/                # Claude AI
    ├── matching/                 # 7요소 매칭 알고리즘
    ├── graph/                    # 그래프 레이아웃
    ├── face-recognition/         # 얼굴 인식 훅
    └── constants/                # 상수 (부서, 직급, MBTI 등)
```

### 2.3 인증 플로우
```
익명 사용자
    ↓
/login (이메일 + 비밀번호)
    ↓
POST /api/auth → Supabase Auth
    ↓
사용자 역할 & 온보딩 상태 확인
    ├─ Admin → /admin/cohorts (기수 선택 필수)
    ├─ User (온보딩 미완료) → /onboarding
    └─ User (온보딩 완료) → /dashboard
```

---

## 3. 기술 스택

### 3.1 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.0.10 | React 풀스택 프레임워크 |
| React | 19.2.1 | UI 라이브러리 |
| TypeScript | 5.x | 타입 안전성 |
| Tailwind CSS | 4.x | 유틸리티 퍼스트 CSS |
| shadcn/ui | - | UI 컴포넌트 라이브러리 |
| Radix UI | - | 접근성 우선 프리미티브 |
| Framer Motion | 12.x | 애니메이션 |

### 3.2 네트워크 시각화
| 기술 | 버전 | 용도 |
|------|------|------|
| @xyflow/react | 12.10.0 | React Flow 그래프 캔버스 |
| d3-force | 3.0.0 | Force-directed 레이아웃 |
| @dagrejs/dagre | 1.1.8 | 계층적 그래프 레이아웃 |

### 3.3 백엔드 & 데이터베이스
| 기술 | 버전 | 용도 |
|------|------|------|
| Supabase | 2.87.1 | PostgreSQL + Auth + Realtime |
| pgvector | - | 벡터 유사도 검색 |

### 3.4 AI/ML
| 기술 | 버전 | 용도 |
|------|------|------|
| OpenAI SDK | 6.10.0 | 임베딩 생성 |
| Anthropic SDK | 0.71.2 | Claude AI 통합 |
| MediaPipe | 0.10.22 | 얼굴 감지 |

### 3.5 기타 라이브러리
| 기술 | 용도 |
|------|------|
| FullCalendar | 캘린더 UI |
| Lucide React | 아이콘 |
| Zod | 스키마 검증 |
| XLSX | Excel 파일 처리 |

---

## 4. AI/ML 시스템

### 4.1 OpenAI 임베딩 시스템

#### 4.1.1 모델 정보
- **모델**: `text-embedding-3-small`
- **차원**: 1536
- **용도**: 프로필 텍스트 → 벡터 변환

#### 4.1.2 임베딩 생성 전략
```typescript
// src/lib/openai/embeddings.ts

프로필 임베딩 생성 필드:
├── collaborationStyle    // 협업 스타일
├── strengths            // 강점
├── preferredPeopleType  // 선호하는 동료 유형
├── workDescription      // 업무 설명
├── techStack            // 기술 스택
├── interests            // 관심사
└── careerGoals          // 커리어 목표

결합 임베딩 = 모든 필드 임베딩의 평균
폴백: 텍스트 없으면 department/jobRole/MBTI/hobbies 사용
```

#### 4.1.3 유사도 계산
```typescript
cosineSimilarity(vectorA, vectorB) {
  dotProduct = Σ(a[i] * b[i])
  magnitudeA = √Σ(a[i]²)
  magnitudeB = √Σ(b[i]²)
  return dotProduct / (magnitudeA * magnitudeB)
}

// 정규화: [-1, 1] → [0, 1]
normalizedScore = (similarity + 1) / 2
```

### 4.2 Anthropic Claude 통합

#### 4.2.1 모델 정보
- **모델**: `claude-sonnet-4-5-20250929`
- **용도**: 프로필 작성 어시스턴트, 쿼리 확장, 팀 편성

#### 4.2.2 프로필 어시스턴트 (`profileAssistant.ts`)
```typescript
기능:
├── suggestHobbyTags()          // 취미 태그 5개 추천
├── suggestRelatedTags()        // 관련 태그 추천
├── generateCollaborationStyle() // 협업 스타일 문구 생성
├── generateStrengths()          // 강점 설명 생성
├── generatePreferredPeopleType() // 선호 동료 유형 생성
├── generateWorkDescription()    // 업무 설명 생성
└── generateCareerGoals()        // 커리어 목표 생성

반환 형식: 메인 제안 + 2-3개 대안
Temperature: 0.7-0.8 (적절한 창의성)
```

#### 4.2.3 쿼리 확장 (`queryExpansion.ts`)
```typescript
// 자연어 검색 쿼리 분석 및 확장

입력: "React 잘하는 외향적인 사람"
    ↓
의도 분류 (Intent Classification):
├── personality  // 성격 특성 ("밝은", "꼼꼼한")
├── skill        // 기술 능력 ("React", "백엔드")
├── hobby        // 취미/활동 ("게임", "운동")
├── mbti         // MBTI 유형 ("INTJ", "외향적")
├── department   // 조직/부서 ("개발팀")
└── general      // 일반 검색
    ↓
출력:
{
  originalQuery: "React 잘하는 외향적인 사람",
  expandedDescription: "React 프론트엔드 개발 경험이 있는 사람",
  suggestedMbtiTypes: ["ENFP", "ENTP", "ESFP", "ESTP"],
  suggestedHobbyTags: [],
  searchKeywords: ["React", "프론트엔드", "외향"],
  profileFieldHints: {
    techStack: ["React", "프론트엔드"],
    strengths: ["외향적", "소통"]
  },
  confidence: 0.85,
  queryIntent: "skill"
}
```

### 4.3 7요소 매칭 알고리즘

#### 4.3.1 가중치 분배
```
┌─────────────────────────────────────────────────────┐
│              7-Factor Matching Algorithm             │
├─────────────────────────────────────────────────────┤
│  1. 임베딩 유사도 (Embedding)     ████████████ 30%  │
│  2. 취미 태그 (Hobby Tags)        ██████████   25%  │
│  3. MBTI 궁합 (MBTI)              █████        12%  │
│  4. 선호도 매칭 (Preferences)     ████         10%  │
│  5. 직급 유사도 (Job Role)        ████         10%  │
│  6. 부서 관계 (Department)        ███           8%  │
│  7. 지역 근접성 (Location)        ██            5%  │
└─────────────────────────────────────────────────────┘
```

#### 4.3.2 각 요소 상세

**1. 임베딩 유사도 (30%)**
```
방법: 코사인 유사도
입력: combined_embedding (1536차원)
범위: 0-1 (정규화됨)
```

**2. 취미 태그 매칭 (25%)**
```
방법: Jaccard 유사도
공식: |A ∩ B| / |A ∪ B|
예시: [러닝,독서] vs [러닝,게임] = 1/3 ≈ 0.33
```

**3. MBTI 궁합 (12%)**
```typescript
// src/lib/matching/mbtiCompatibility.ts
// 16x16 사전 계산된 궁합 매트릭스

궁합 점수 티어:
├── 1.00: 이상적 매칭 (INTJ↔ENTP, INFJ↔ENFP)
├── 0.85: 같은 기질 그룹
├── 0.70: 좋은 보완 관계
├── 0.55: 중립
└── 0.40: 도전적 관계

기질 그룹:
├── NT (분석가): INTJ, INTP, ENTJ, ENTP
├── NF (외교관): INFJ, INFP, ENFJ, ENFP
├── SJ (수호자): ISTJ, ISFJ, ESTJ, ESFJ
└── SP (탐험가): ISTP, ISFP, ESTP, ESFP
```

**4. 직급 유사도 (10%)**
```typescript
// src/lib/matching/jobRoleScoring.ts

직급 구분:
├── Executive (임원)
├── Management (관리직)
├── Research (연구직)
├── General (일반직)
└── Overseas (해외직)

점수:
├── 1.0: 인접 레벨 (멘토/멘티 잠재력)
├── 0.8: 같은 레벨 (동료 협업)
├── 0.7: 연구직-관리직 시너지
└── 0.5-0.3: 관련/다른 역할
```

**5. 부서 관계 (8%)**
```typescript
// src/lib/matching/departmentScoring.ts

조직 구조: 연구소/센터 > 실 > 팀 (3단계)

점수:
├── 1.0: 높은 조직 시너지 (정의된 파트너십)
├── 0.8: 같은 1단계(연구소), 다른 2단계
├── 0.5: 같은 2단계(실), 다른 팀
├── 0.3: 같은 팀 (동료 네트워킹)
└── 0.4: 시너지 없는 다른 조직
```

**6. 지역 근접성 (5%)**
```typescript
// src/lib/matching/locationScoring.ts

점수:
├── 1.0: 같은 위치
├── 0.7: 같은 도시권 (서울 내)
├── 0.5: 재택근무
├── 0.4: 다른 광역시
└── 0.3: 다른 도시/해외/제주
```

**7. 사용자 선호도 (10%)**
```
선호 항목:
├── 선호 부서/조직
├── 선호 직급
├── 선호 근무지
└── 선호 MBTI 유형

점수: 매칭된 항목 수 / 총 설정 항목
기본값: 0.5 (선호도 미설정 시)
```

### 4.4 시맨틱 검색 시스템

#### 4.4.1 하이브리드 검색 아키텍처
```
입력 쿼리: "React 잘하는 사람"
    ↓
[전략 선택]
├─ 짧고 구체적 키워드 → text_heavy 전략
├─ 중간 혼합 → balanced 전략
└─ 긴 설명적 쿼리 → vector_heavy 전략
    ↓
[Claude 쿼리 확장] (선택적)
├─ 의도 분류
├─ 프로필 필드 힌트 추출
├─ MBTI/취미 검증
└─ Claude 불가 시 폴백
    ↓
[임베딩 생성]
└─ OpenAI text-embedding-3-small → 1536차원 벡터
    ↓
[후보 검색]
├─ 기수 내 모든 프로필 (최대 100명)
├─ 각 프로필의 임베딩 로드
└─ 모든 프로필 필드 포함
    ↓
[하이브리드 스코어링]
├─ 벡터 유사도 (cosineSimilarity)
├─ 프로필 필드 점수 (키워드 매칭)
├─ MBTI 매칭 점수
├─ 태그 매칭 점수 (Jaccard)
└─ 텍스트 매칭 점수 (키워드 + 동의어)
    ↓
[의도별 동적 가중치]
skill:       텍스트 50% + 벡터 15% + 필드 25%
hobby:       태그 40% + 텍스트 25% + 벡터 15%
personality: 필드 40% + 벡터 20% + 텍스트 25%
department:  텍스트 60% + 필드 20% + 벡터 10%
mbti:        MBTI 50% + 벡터 10% + 필드 15%
general:     균형 배분 (각 ~20%)
    ↓
[결과 랭킹 & 필터링]
├─ 가중 합산 = totalScore
├─ minScore 임계값 필터 (기본 0.15)
├─ 점수 내림차순 정렬
└─ 상위 N개 반환 + 메타데이터
```

### 4.5 얼굴 인식 시스템

#### 4.5.1 아키텍처
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   웹 브라우저    │────▶│   Next.js API   │────▶│   FastAPI 서버   │
│   MediaPipe     │     │   /recognize    │     │   Railway 배포   │
│   얼굴 감지     │     │   프록시 역할    │     │   임베딩 비교    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

#### 4.5.2 MediaPipe 얼굴 감지
```typescript
// src/lib/face-recognition/hooks/useMediaPipe.ts

모델: Blaze Face (Short Range)
URL: storage.googleapis.com/mediapipe-models/face_detector/
추론: GPU 가속

설정:
├── MIN_DETECTION_CONFIDENCE: 0.5 (50%)
├── 실행 모드: VIDEO (프레임별 처리)
├── 인식 간격: 1초
└── IoU 추적 임계값: 0.3

출력:
├── FaceDetectionBox: {x, y, width, height}
├── TrackedFace: {id, box, lastSeen}
└── faceCount: 감지된 얼굴 수
```

#### 4.5.3 인식 결과 형식
```typescript
interface RecognitionResult {
  track_id: string;        // 추적 ID
  recognized: boolean;     // 인식 성공 여부
  user_id?: string;        // 매칭된 사용자 ID
  profile?: {
    name: string;
    email: string;
    department: string;
    job_role: string;
    office_location: string;
    mbti?: string;
  };
  confidence: number;      // 신뢰도 (0-1)
  method: string;          // 인식 방법
  latency_ms: number;      // 응답 시간
}
```

---

## 5. 데이터베이스 설계

### 5.1 핵심 테이블

#### users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  employee_id TEXT,
  role TEXT DEFAULT 'user',  -- 'user' | 'admin'
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
```

#### profiles (프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  cohort_id UUID REFERENCES cohorts(id),

  -- 조직 정보 (3단계 계층)
  org_level1 TEXT,         -- 연구소/센터
  org_level2 TEXT,         -- 실
  org_level3 TEXT,         -- 팀

  -- 직무 정보
  job_position TEXT,       -- 직급
  office_location TEXT,    -- 근무지

  -- 개인 정보
  mbti TEXT,
  hobbies TEXT[],

  -- AI 생성 텍스트
  collaboration_style TEXT,
  strengths TEXT,
  preferred_people_type TEXT,
  work_description TEXT,
  tech_stack TEXT,
  interests TEXT,
  career_goals TEXT,

  -- 기타
  onboarding_completed BOOLEAN DEFAULT false,
  visibility_settings JSONB,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### embeddings (임베딩)
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),

  -- 결합 임베딩 (메인)
  combined_embedding VECTOR(1536),

  -- 필드별 임베딩
  collaboration_style_embedding VECTOR(1536),
  strengths_embedding VECTOR(1536),
  preferred_people_type_embedding VECTOR(1536),

  -- 변경 감지
  text_hash TEXT,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### cohorts (기수)
```sql
CREATE TABLE cohorts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ
);
```

#### fr_identities (얼굴 인식)
```sql
CREATE TABLE fr_identities (
  id UUID PRIMARY KEY,
  external_key TEXT,        -- users.id 연결
  embedding VECTOR(128),    -- 얼굴 임베딩
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 5.2 커뮤니케이션 테이블

#### conversations (대화)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  participant_1 UUID REFERENCES users(id),
  participant_2 UUID REFERENCES users(id),
  cohort_id UUID REFERENCES cohorts(id),
  last_message_at TIMESTAMPTZ
);
```

#### messages (메시지)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  content TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);
```

### 5.3 기수 기반 데이터 격리

```
모든 데이터는 cohort_id로 완전 격리
├── profiles.cohort_id
├── conversations.cohort_id
├── announcements.cohort_id
├── board_posts.cohort_id
├── calendar_events.cohort_id
└── team_grouping_results.cohort_id

관리자 플로우:
1. /admin/cohorts에서 기수 선택
2. 쿠키에 admin_selected_cohort 저장
3. 모든 API 요청에서 해당 기수 데이터만 접근
```

---

## 6. 주요 기능 모듈

### 6.1 온보딩 시스템
```
경로: src/components/onboarding/

8단계 프로세스:
1. Intro + 오디오 동의
2. 기본 정보 (이름, 사번)
3. MBTI 선택
4. 개인 정보 (취미, 관심사)
5. 업무 정보 (부서, 직급, 근무지)
6. 취미 태그 선택
7. 자기소개 (AI 어시스턴트)
8. 완료

특징:
├── 배경 음악 토글
├── 진행 상황 추적
├── Claude AI 텍스트 생성
├── OpenAI 태그 추천
└── Framer Motion 애니메이션
```

### 6.2 네트워크 시각화
```
경로: src/app/(main)/network/

레이아웃 모드:
├── Force-directed (표준)
│   └── d3-force 기반 물리 시뮬레이션
├── Search-based (검색 결과)
│   └── 관련도 기반 동심원 배치
└── Cluster (부서별)
    └── 부서별 클러스터링

노드 스타일 (관련도별):
├── ≥70%: Scale 1.08, violet-500, 글로우
├── 50-69%: Scale 1.04, violet-400
├── 30-49%: Scale 1.0, violet-300
└── <30%: Scale 0.95, gray

배치 공식 (검색):
targetRadius = 150 + (1 - relevance) × 430
├── 95% → 171px
├── 70% → 279px
├── 50% → 365px
└── 30% → 451px
```

### 6.3 관리자 기능
```
경로: src/app/(main)/admin/

기수 관리:
├── 기수 생성/수정/삭제
├── 기수 선택 (쿠키 저장)
├── 기수별 멤버 조회
└── 사용자 기수 이동

직원 관리:
├── 개별 등록
├── CSV/Excel 일괄 등록
├── 사번/전화번호 할당
├── 자동 비밀번호 생성
└── 아바타 일괄 업로드
```

### 6.4 AI 팀 편성
```
경로: src/lib/team-grouping/

기능:
├── 자연어 기준 파싱 (Claude)
├── 균형 잡힌 팀 구성
├── 다양성 최적화
├── 결과 저장/공유
└── 시각화
```

---

## 7. API 명세

### 7.1 응답 형식
```typescript
// 성공
{ success: true, data: {...} }

// 에러
{ success: false, error: { code: string, message: string } }
```

### 7.2 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| **프로필** |
| POST | `/api/profile` | 프로필 생성/수정 |
| GET | `/api/profile/[id]` | 프로필 조회 |
| GET | `/api/profile/me` | 내 프로필 조회 |
| POST | `/api/profile/suggest-tags` | AI 태그 추천 |
| POST | `/api/profile/generate-text` | AI 텍스트 생성 |
| **네트워크** |
| GET | `/api/graph/network` | 네트워크 그래프 데이터 |
| POST | `/api/graph/semantic-search` | 시맨틱 검색 |
| **관리자** |
| GET/POST | `/api/admin/cohorts` | 기수 관리 |
| GET/POST | `/api/admin/employees` | 직원 관리 |
| POST | `/api/admin/employees/csv` | CSV 가져오기 |
| **커뮤니케이션** |
| GET/POST | `/api/conversations` | 대화 목록/생성 |
| GET/POST | `/api/conversations/[id]/messages` | 메시지 조회/전송 |
| GET/POST | `/api/announcements` | 공지사항 |
| GET/POST | `/api/board/posts` | 게시판 |
| **캘린더** |
| GET/POST | `/api/calendar` | 일정 조회/생성 |
| PUT/DELETE | `/api/calendar/[id]` | 일정 수정/삭제 |
| **얼굴 인식** |
| POST | `/api/face-recognition/upload-face` | 얼굴 등록 |
| POST | `/api/face-recognition/recognize` | 얼굴 인식 |
| GET | `/api/face-recognition/embeddings/status` | 등록 현황 |
| **팀 편성** |
| POST | `/api/team-grouping/generate` | 팀 생성 (관리자) |
| GET | `/api/team-grouping/history` | 히스토리 조회 |

---

## 8. 보안 및 인증

### 8.1 인증 시스템
```
├── Supabase Auth (이메일/비밀번호)
├── JWT 토큰 기반 세션
├── 미들웨어 라우트 보호
└── 역할 기반 접근 제어 (RBAC)
```

### 8.2 Row Level Security (RLS)
```sql
-- 예시: 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- 예시: 같은 기수 사용자만 조회 가능
CREATE POLICY "Users can view same cohort profiles"
ON profiles FOR SELECT
USING (cohort_id = get_user_cohort());
```

### 8.3 가시성 설정
```typescript
// 사용자가 각 필드의 공개 범위 설정 가능

가시성 레벨:
├── public: 모두에게 공개
├── department: 같은 부서만
└── private: 본인만

적용 필드:
department, job_role, location, mbti, hobbies,
collaboration_style, strengths, preferred_people_type,
living_location, hometown, education, work_description,
tech_stack, favorite_food, age_range, interests,
career_goals, certifications, languages
```

---

## 부록: 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 얼굴 인식 (선택)
RECOG_API_URL=https://sureus.up.railway.app
```

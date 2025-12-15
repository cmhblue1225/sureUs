# sureNet - 사내 네트워킹 서비스

> 유사도 기반 직원 매칭 및 동호회 플랫폼

## 프로젝트 개요

sureNet은 사내 직원들의 관심사, 성향, 업무 환경을 기반으로 유사한 동료를 추천하고, 동호회 활동을 통해 네트워킹을 활성화하는 소셜 플랫폼입니다.

### 주요 특징
- **AI 기반 매칭**: OpenAI 임베딩 + 다중 요소 알고리즘으로 정교한 동료 추천
- **인터랙티브 네트워크 시각화**: React Flow를 활용한 소셜 그래프
- **동호회 시스템**: 게시판, 실시간 채팅, 투표, 갤러리 기능
- **LLM 통합**: Anthropic Claude를 활용한 AI 어시스턴트 기능

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.0.10 | App Router 기반 풀스택 프레임워크 |
| React | 19.2.1 | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 4.x | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 라이브러리 |
| Radix UI | - | 접근성 있는 UI 프리미티브 |
| Lucide React | 0.561.0 | 아이콘 |
| React Flow (@xyflow/react) | 12.10.0 | 네트워크 그래프 시각화 |

### Backend & Database
| 기술 | 용도 |
|------|------|
| Supabase | PostgreSQL 데이터베이스, 인증, 실시간 구독, Storage |
| Supabase Auth | 이메일/비밀번호 인증 |
| Supabase Realtime | WebSocket 기반 실시간 채팅 |
| Supabase Storage | 이미지 저장 (아바타, 동호회 갤러리) |
| pgvector | 벡터 유사도 검색 (임베딩) |

### AI/ML
| 기술 | 용도 |
|------|------|
| OpenAI API | text-embedding-3-small 모델로 프로필 임베딩 생성 |
| Anthropic Claude API | 동호회 설명 생성, 활동 요약, 추천 이유 설명 |

### 배포
| 기술 | 용도 |
|------|------|
| Railway | 애플리케이션 호스팅 |
| Supabase Cloud | 데이터베이스 호스팅 |

---

## 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (임베딩 생성)
OPENAI_API_KEY=sk-...

# Anthropic (LLM 기능)
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

---

## 기능 상세

### Phase 1-2: 핵심 기능

#### 인증 시스템
- Supabase Auth 기반 이메일/비밀번호 로그인
- 미들웨어를 통한 세션 관리
- 보호된 라우트 자동 리다이렉트

#### 프로필 관리
- 기본 정보: 이름, 소개, 아바타
- 업무 정보: 부서, 직군, 근무지
- 성향 정보: MBTI
- 관심사: 취미 태그 (최대 10개)
- **자동 임베딩 생성**: 프로필 저장 시 OpenAI API로 벡터 생성

#### 검색 기능
- 이름 검색
- 필터: 부서, 직군, 근무지
- 페이지네이션

### Phase 3: 알림 시스템

- 실시간 알림 벨 UI
- 알림 유형: 메시지, 동호회 가입 신청, 추천 등
- 읽음/안읽음 상태 관리
- 일괄 읽음 처리

### Phase 4: 1:1 메시지 시스템

- 대화 목록 및 상세 페이지
- 실시간 메시지 송수신
- 읽음 상태 표시
- 새 대화 시작 (프로필에서)

### Phase 5: 배포

- Railway 배포 설정
- 환경 변수 관리
- 빌드 최적화

### Phase 6: 알고리즘 및 시각화 고도화

#### 7요소 매칭 알고리즘
| 요소 | 가중치 | 설명 |
|------|--------|------|
| 임베딩 유사도 | 25% | 프로필 텍스트 벡터 코사인 유사도 |
| 취미 태그 | 20% | Jaccard 유사도 |
| MBTI 궁합 | 15% | 16x16 궁합 매트릭스 |
| 직군 유사도 | 15% | 직군 간 협업 점수 |
| 부서 관계 | 10% | 협업 빈도 기반 |
| 지역 근접성 | 10% | 근무지 거리 |
| 선호도 | 5% | 사용자 설정 가중치 |

#### 네트워크 시각화
- **클러스터링**: 부서/직군/지역 기반 그룹화
- **Force-directed 레이아웃**: dagre 알고리즘
- **인터랙티브 기능**:
  - 노드 호버 시 연결 하이라이트
  - 유사도 필터 슬라이더
  - 클러스터 확장/축소
  - 줌/팬 컨트롤

### Phase 7: 동호회 시스템

#### 7-1. 동호회 기본
- **CRUD**: 동호회 생성, 조회, 수정, 삭제
- **카테고리**: 스포츠, 취미, 자기개발, 기술/IT, 소셜, 문화/예술, 기타
- **가입 정책**: 공개(즉시 가입) / 승인제
- **역할**: 회장(leader), 일반회원(member)

#### 7-2. 회원 관리
- 가입 신청 및 승인/거절
- 회원 목록 조회
- 강퇴 기능 (회장 전용)
- 탈퇴 기능

#### 7-3. 게시판
- **게시물 유형**: 일반, 공지(회장), 투표, 갤러리
- 댓글 시스템
- 좋아요 기능
- 고정 게시물 (회장)

#### 7-4. 실시간 채팅
- Supabase Realtime (postgres_changes)
- 메시지 히스토리 로드
- 공지 메시지 (회장)
- 자동 스크롤 및 새 메시지 알림

#### 7-5. 투표 기능
- 단일/복수 선택 옵션
- 마감일 설정
- 실시간 결과 표시 (막대 그래프)
- 투표 취소 기능

#### 7-6. 갤러리
- 이미지 업로드 (최대 20MB, JPEG/PNG/WebP/GIF)
- 드래그앤드롭 지원
- 라이트박스 뷰어
- 그리드 레이아웃

#### 7-7. 동호회 추천 알고리즘
| 요소 | 가중치 | 설명 |
|------|--------|------|
| 태그 매칭 | 35% | 사용자 태그 vs 동호회 태그 |
| 소셜 그래프 | 25% | 추천 동료들의 가입 동호회 |
| 회원 구성 | 20% | 기존 회원과의 유사도 |
| 활동도 | 10% | 최근 7일 활동량 |
| 카테고리 선호 | 10% | 관심사 기반 카테고리 추론 |

#### 7-8. LLM 통합 (Anthropic Claude)
- **동호회 설명 생성**: AI가 카테고리/태그 기반 소개글 작성
- **활동 요약**: 주간 활동 자동 요약
- **추천 이유 설명**: 개인화된 추천 이유 생성

---

## 데이터베이스 스키마

### 핵심 테이블

```
users
├── id (uuid, PK)
├── email
├── name
├── avatar_url
├── bio
├── department
├── job_role
├── location
├── mbti
├── hobby_tags (text[])
├── embedding (vector(1536))
├── preference_weights (jsonb)
└── created_at, updated_at

conversations
├── id (uuid, PK)
├── participant1_id → users
├── participant2_id → users
└── last_message_at

messages
├── id (uuid, PK)
├── conversation_id → conversations
├── sender_id → users
├── content
├── is_read
└── created_at

notifications
├── id (uuid, PK)
├── user_id → users
├── type
├── title, message
├── data (jsonb)
├── is_read
└── created_at
```

### 동호회 테이블

```
clubs
├── id (uuid, PK)
├── name
├── description
├── category
├── image_url
├── join_policy (public/approval)
├── leader_id → users
├── member_count
├── tags (text[])
└── created_at, updated_at

club_members
├── id (uuid, PK)
├── club_id → clubs
├── user_id → users
├── role (leader/member)
├── status (active/left/kicked)
└── joined_at

club_join_requests
├── id (uuid, PK)
├── club_id → clubs
├── user_id → users
├── message
├── status (pending/approved/rejected)
└── created_at, processed_at

club_posts
├── id (uuid, PK)
├── club_id → clubs
├── author_id → users
├── type (post/announcement/poll/gallery)
├── title, content
├── image_urls (text[])
├── is_pinned
├── like_count, comment_count
└── created_at, updated_at

club_comments
├── id (uuid, PK)
├── post_id → club_posts
├── author_id → users
├── content
└── created_at

club_likes
├── id (uuid, PK)
├── post_id → club_posts
├── user_id → users (UNIQUE)

club_polls
├── id (uuid, PK)
├── post_id → club_posts
├── question
├── options (text[])
├── allow_multiple
├── end_date
├── is_closed

club_poll_votes
├── id (uuid, PK)
├── poll_id → club_polls
├── user_id → users
├── option_indexes (int[])

club_chat_messages
├── id (uuid, PK)
├── club_id → clubs
├── sender_id → users
├── content
├── type (message/announcement)
└── created_at
```

### Storage 버킷

| 버킷 | 용도 | 제한 |
|------|------|------|
| avatars | 사용자 프로필 이미지 | 공개 |
| club-images | 동호회 갤러리 이미지 | 20MB, JPEG/PNG/WebP/GIF |

---

## API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/callback | OAuth 콜백 |
| POST | /api/auth/create-user | 사용자 생성 |

### 프로필
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/profile | 내 프로필 조회 |
| PATCH | /api/profile | 프로필 수정 (임베딩 자동 생성) |
| GET | /api/profile/[id] | 타 사용자 프로필 조회 |
| GET | /api/profile/me | 내 프로필 간략 조회 |
| GET | /api/user | 현재 사용자 정보 |

### 검색 및 추천
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/search/users | 사용자 검색 |
| GET | /api/match/recommendations | 추천 동료 목록 |
| GET | /api/graph/network | 네트워크 그래프 데이터 |

### 메시지
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/conversations | 대화 목록 |
| POST | /api/conversations | 새 대화 시작 |
| GET | /api/conversations/[id] | 대화 상세 |
| GET | /api/conversations/[id]/messages | 메시지 목록 |
| POST | /api/conversations/[id]/messages | 메시지 전송 |

### 알림
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/notifications | 알림 목록 |
| PATCH | /api/notifications | 읽음 처리 |

### 동호회
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/clubs | 동호회 목록 |
| POST | /api/clubs | 동호회 생성 |
| GET | /api/clubs/[id] | 동호회 상세 |
| PATCH | /api/clubs/[id] | 동호회 수정 |
| DELETE | /api/clubs/[id] | 동호회 삭제 |
| POST | /api/clubs/[id]/join | 가입 신청 |
| DELETE | /api/clubs/[id]/join | 가입 신청 취소 |
| POST | /api/clubs/[id]/leave | 탈퇴 |
| GET | /api/clubs/[id]/members | 회원 목록 |
| DELETE | /api/clubs/[id]/members/[userId] | 강퇴 |
| GET | /api/clubs/[id]/requests | 가입 신청 목록 |
| PATCH | /api/clubs/[id]/requests/[requestId] | 신청 승인/거절 |

### 게시판
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/clubs/[id]/posts | 게시물 목록 |
| POST | /api/clubs/[id]/posts | 게시물 작성 |
| GET | /api/clubs/[id]/posts/[postId] | 게시물 상세 |
| PATCH | /api/clubs/[id]/posts/[postId] | 게시물 수정 |
| DELETE | /api/clubs/[id]/posts/[postId] | 게시물 삭제 |
| POST | /api/clubs/[id]/posts/[postId]/like | 좋아요 토글 |
| GET | /api/clubs/[id]/posts/[postId]/comments | 댓글 목록 |
| POST | /api/clubs/[id]/posts/[postId]/comments | 댓글 작성 |
| DELETE | /api/clubs/[id]/posts/[postId]/comments | 댓글 삭제 |
| POST | /api/clubs/[id]/posts/[postId]/vote | 투표 참여 |
| DELETE | /api/clubs/[id]/posts/[postId]/vote | 투표 취소 |

### 채팅
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/clubs/[id]/chat | 채팅 메시지 조회 |
| POST | /api/clubs/[id]/chat | 메시지 전송 |

### 갤러리
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/clubs/[id]/images | 이미지 업로드 |
| DELETE | /api/clubs/[id]/images | 이미지 삭제 |

### 추천 (동호회)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/clubs/recommendations | 추천 동호회 목록 |
| POST | /api/clubs/recommendations/explain | 추천 이유 AI 생성 |

### LLM 기능
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/clubs/[id]/generate-description | 동호회 설명 AI 생성 |
| GET | /api/clubs/[id]/activity-summary | 활동 요약 AI 생성 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (main)/                    # 인증 필요 라우트
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── recommendations/
│   │   ├── network/
│   │   ├── messages/
│   │   ├── clubs/
│   │   │   ├── [id]/
│   │   │   │   ├── posts/
│   │   │   │   ├── chat/
│   │   │   │   ├── gallery/
│   │   │   │   ├── members/
│   │   │   │   └── requests/
│   │   │   └── create/
│   │   └── settings/
│   ├── api/                       # API 라우트
│   ├── login/
│   └── signup/
├── components/
│   ├── ui/                        # shadcn/ui 컴포넌트
│   ├── layout/                    # Header, Sidebar, NotificationBell
│   ├── graph/                     # 네트워크 시각화 컴포넌트
│   └── clubs/                     # 동호회 관련 컴포넌트
├── lib/
│   ├── supabase/                  # Supabase 클라이언트
│   ├── openai/                    # OpenAI 임베딩
│   ├── anthropic/                 # Anthropic Claude
│   ├── matching/                  # 매칭 알고리즘
│   ├── graph/                     # 그래프 레이아웃/클러스터링
│   ├── clubs/                     # 동호회 추천 알고리즘
│   ├── constants/                 # 부서, 직군, 지역, MBTI 상수
│   └── utils/                     # 유틸리티 함수
└── hooks/                         # 커스텀 훅
```

---

## 실행 방법

### 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

### 환경 변수 설정

1. `.env.local` 파일 생성
2. 위의 환경 변수 섹션 참고하여 값 설정
3. Supabase 프로젝트 설정 및 마이그레이션 실행

---

## 개발 히스토리

| 날짜 | Phase | 내용 |
|------|-------|------|
| 2025-12-15 | 1 | 프로젝트 관리 설정 (CLAUDE.md, phase.md) |
| 2025-12-15 | 2 | 임베딩 자동 생성, 타 사용자 프로필 |
| 2025-12-15 | 3 | 알림 시스템 구현 |
| 2025-12-15 | 4 | 1:1 메시지 시스템 구현 |
| 2025-12-15 | 5 | 버그 수정 및 배포 |
| 2025-12-15 | 6 | 7요소 매칭 알고리즘, 클러스터링, 인터랙티브 시각화 |
| 2025-12-15 | 7 | 동호회 기본 기능, 게시판, 실시간 채팅 |
| 2025-12-16 | 7 | 투표, 갤러리, 추천 알고리즘, LLM 통합 |

---

## 라이선스

Private - 내부 사용 전용

---

*마지막 업데이트: 2025-12-16*

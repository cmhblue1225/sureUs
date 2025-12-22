# sureNet 개발 진행 현황

> 마지막 업데이트: 2025-12-22

## 현재 Phase: 27 완료 (슈아유? - 얼굴 인식 통합)

---

## Phase 27: 슈아유? - 얼굴 인식 시스템 통합
**상태: 완료**

### 목표
sureus-facerec-claude 레포지토리의 얼굴 인식 시스템을 sureNet에 완벽하게 통합

### 27-1. 의존성 및 환경 설정
| 작업 | 상태 | 파일 |
|------|------|------|
| @mediapipe/tasks-vision 설치 | ✅ 완료 | `package.json` |
| lodash.throttle 설치 | ✅ 완료 | `package.json` |
| framer-motion 설치 | ✅ 완료 | `package.json` |
| 환경 변수 추가 | ✅ 완료 | `.env.local` |

### 27-2. 설정 및 타입 파일
| 작업 | 상태 | 파일 |
|------|------|------|
| 얼굴 인식 설정 파일 | ✅ 완료 | `src/lib/face-recognition/config.ts` |
| 타입 정의 | ✅ 완료 | `src/lib/face-recognition/types.ts` |
| face_embeddings 타입 추가 | ✅ 완료 | `src/types/database.ts` |

### 27-3. 훅 마이그레이션
| 작업 | 상태 | 파일 |
|------|------|------|
| useMediaPipe 훅 | ✅ 완료 | `src/lib/face-recognition/hooks/useMediaPipe.ts` |
| useFaceRecognition 훅 | ✅ 완료 | `src/lib/face-recognition/hooks/useFaceRecognition.ts` |

### 27-4. 컴포넌트 마이그레이션
| 작업 | 상태 | 파일 |
|------|------|------|
| ProfileCard 컴포넌트 | ✅ 완료 | `src/components/face-recognition/ProfileCard.tsx` |
| FaceOverlay 컴포넌트 | ✅ 완료 | `src/components/face-recognition/FaceOverlay.tsx` |
| ProfileDetailPanel 컴포넌트 | ✅ 완료 | `src/components/face-recognition/ProfileDetailPanel.tsx` |

### 27-5. API 라우트
| 작업 | 상태 | 파일 |
|------|------|------|
| 인식 API 프록시 | ✅ 완료 | `src/app/api/face-recognition/recognize/route.ts` |
| 얼굴 등록 API | ✅ 완료 | `src/app/api/face-recognition/upload-face/route.ts` |
| 임베딩 상태 조회 | ✅ 완료 | `src/app/api/face-recognition/embeddings/status/route.ts` |
| 임베딩 삭제 | ✅ 완료 | `src/app/api/face-recognition/embeddings/delete/route.ts` |

### 27-6. 페이지 생성
| 작업 | 상태 | 파일 |
|------|------|------|
| 슈아유? 메인 페이지 | ✅ 완료 | `src/app/(main)/face-recognition/page.tsx` |
| 얼굴 등록 관리 페이지 | ✅ 완료 | `src/app/(main)/face-recognition/manage/page.tsx` |
| 라이브 스트림 페이지 | ✅ 완료 | `src/app/(main)/face-recognition/live/page.tsx` |

### 27-7. 사이드바 통합
| 작업 | 상태 | 파일 |
|------|------|------|
| 슈아유? 메뉴 추가 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |

### 기능 요약
- **슈아유?**: 실시간 얼굴 인식 (MediaPipe + FastAPI)
- **얼굴 등록 관리**: 사용자 얼굴 이미지 업로드 및 임베딩 저장
- **라이브 스트림**: WebRTC 기반 모바일 화면 스트리밍
- **FastAPI 백엔드**: https://sureus.up.railway.app

### 신규 파일
| 파일 | 용도 |
|------|------|
| `src/lib/face-recognition/config.ts` | 얼굴 인식 설정 |
| `src/lib/face-recognition/types.ts` | 타입 정의 |
| `src/lib/face-recognition/hooks/useMediaPipe.ts` | MediaPipe 얼굴 감지 훅 |
| `src/lib/face-recognition/hooks/useFaceRecognition.ts` | 얼굴 인식 훅 |
| `src/components/face-recognition/ProfileCard.tsx` | 프로필 카드 |
| `src/components/face-recognition/FaceOverlay.tsx` | 얼굴 박스 오버레이 |
| `src/components/face-recognition/ProfileDetailPanel.tsx` | 프로필 상세 패널 |
| `src/app/api/face-recognition/recognize/route.ts` | 인식 API |
| `src/app/api/face-recognition/upload-face/route.ts` | 얼굴 등록 API |
| `src/app/api/face-recognition/embeddings/status/route.ts` | 상태 조회 API |
| `src/app/api/face-recognition/embeddings/delete/route.ts` | 삭제 API |
| `src/app/(main)/face-recognition/page.tsx` | 메인 페이지 |
| `src/app/(main)/face-recognition/manage/page.tsx` | 관리 페이지 |
| `src/app/(main)/face-recognition/live/page.tsx` | 라이브 스트림 페이지 |

### 환경 변수
```env
NEXT_PUBLIC_RECOG_API_URL=https://sureus.up.railway.app
RECOG_API_URL=https://sureus.up.railway.app
```

### 필요한 데이터베이스 테이블
- `face_embeddings`: 사용자 얼굴 임베딩 저장
- `webrtc_signals`: WebRTC 시그널링 (라이브 스트림용, 선택)

---

## Phase 26 완료 (기본 아바타 이미지)

---

## Phase 26: 기본 아바타 이미지
**상태: 완료**

### 목표
프로필 사진이 없는 사용자에게 기본 아바타 이미지(favicon.ico) 표시

### 26-1. UserAvatar 컴포넌트 생성
| 작업 | 상태 | 파일 |
|------|------|------|
| UserAvatar 컴포넌트 생성 | ✅ 완료 | `src/components/ui/user-avatar.tsx` |
| DEFAULT_AVATAR_URL 상수 정의 | ✅ 완료 | `src/components/ui/user-avatar.tsx` |

### 26-2. 컴포넌트 업데이트
| 작업 | 상태 | 파일 |
|------|------|------|
| Header 아바타 수정 | ✅ 완료 | `src/components/layout/Header.tsx` |
| ProfileModal 아바타 수정 | ✅ 완료 | `src/components/graph/ProfileModal.tsx` |
| TeamGroupingPanel 아바타 수정 | ✅ 완료 | `src/components/graph/TeamGroupingPanel.tsx` |
| EnhancedUserNode 아바타 수정 | ✅ 완료 | `src/components/graph/EnhancedUserNode.tsx` |
| CohortMemberList 아바타 수정 | ✅ 완료 | `src/components/graph/CohortMemberList.tsx` |
| Dashboard 아바타 수정 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| Messages 아바타 수정 | ✅ 완료 | `src/app/(main)/messages/page.tsx` |
| Messages Detail 아바타 수정 | ✅ 완료 | `src/app/(main)/messages/[id]/page.tsx` |

### 기능 요약
- **UserAvatar 컴포넌트**: 재사용 가능한 아바타 컴포넌트
- **기본 이미지**: `/favicon.ico`를 기본 아바타로 사용
- **사이즈 옵션**: xs(24px), sm(32px), md(40px), lg(64px), xl(96px)

### 신규 파일
| 파일 | 용도 |
|------|------|
| `src/components/ui/user-avatar.tsx` | 재사용 가능한 아바타 컴포넌트 |

---

## 현재 Phase: 25 완료 (AI 기반 조 편성)

---

## Phase 25: AI 기반 조 편성
**상태: 완료**

### 목표
기존 규칙 기반 알고리즘을 Claude AI 기반으로 전환하여 조 편성 품질 향상

### 25-1. AI 조 편성 구현
| 작업 | 상태 | 파일 |
|------|------|------|
| GeneratedTeam 타입에 reasoning 필드 추가 | ✅ 완료 | `src/lib/team-grouping/types.ts` |
| AI 조 편성 모듈 생성 | ✅ 완료 | `src/lib/team-grouping/aiGrouping.ts` |
| generate route AI 호출로 변경 | ✅ 완료 | `src/app/api/team-grouping/generate/route.ts` |
| 팀 카드에 reasoning 표시 | ✅ 완료 | `src/components/graph/TeamGroupingPanel.tsx` |

### 기능 요약
- **AI 조 편성**: Claude가 멤버 정보와 기준을 분석하여 최적 팀 구성
- **구성 이유**: 각 팀별로 왜 이렇게 구성했는지 설명 제공
- **폴백 없음**: AI 실패 시 에러 반환 (규칙 기반 폴백 제거)
- **관리자 제외**: admin@test.com 및 role='admin' 사용자 제외

### 신규 파일
| 파일 | 용도 |
|------|------|
| `src/lib/team-grouping/aiGrouping.ts` | Claude API 기반 조 편성 로직 |

---

## Phase 24: 기수 동료 리스트 탭
**상태: 완료**

### 목표
네트워크 페이지에 탭 UI 추가하여 기수 동료를 리스트 형태로 볼 수 있는 기능

### 24-1. 탭 UI 및 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| CohortMemberList 컴포넌트 생성 | ✅ 완료 | `src/components/graph/CohortMemberList.tsx` |
| export 추가 | ✅ 완료 | `src/components/graph/index.ts` |
| Tabs UI 추가 | ✅ 완료 | `src/app/(main)/network/page.tsx` |

### 기능 요약
- **탭 전환**: "네트워크 그래프" / "기수 동료" 탭
- **카드 그리드**: 동료들을 카드 형태로 표시 (본인 제외)
- **검색**: 이름, 부서, 직군으로 검색
- **정렬**: 유사도순, 이름순 정렬
- **필터**: 부서별, MBTI별 필터링
- **프로필 모달**: 기존 ProfileModal 재사용

### 신규 파일
| 파일 | 용도 |
|------|------|
| `src/components/graph/CohortMemberList.tsx` | 기수 동료 리스트 컴포넌트 |

---

## Phase 23: 네트워크 노드 배치 개선
**상태: 완료**

### 목표
검색 결과에서 관련도(relevanceScore)에 따라 노드가 연속적으로 배치되도록 개선
- 관련도 높음 → 중심에 가깝게
- 관련도 낮음 → 중심에서 멀리

### 23-1. 노드 배치 알고리즘 개선
| 작업 | 상태 | 파일 |
|------|------|------|
| SEARCH_LAYOUT_CONFIG 상수 추가 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| runSearchBasedForceLayout 연속적 반경 계산 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| 골든 앵글 기반 분산 배치 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| 노드 충돌 방지 로직 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |

### 23-2. Zone 경계 동기화
| 작업 | 상태 | 파일 |
|------|------|------|
| ZONE_RADII 상수 업데이트 | ✅ 완료 | `src/app/(main)/network/page.tsx` |

### 23-3. 노드 오프셋 일관성 수정 (2025-12-21 추가)
| 작업 | 상태 | 파일 |
|------|------|------|
| 모든 노드에 동일한 오프셋 적용 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| 검색 레이아웃 오프셋 적용 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| 초기 Force 레이아웃 오프셋 적용 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| 디버그 로깅 추가 | ✅ 완료 | `src/lib/graph/forceLayout.ts`, `network/page.tsx` |

**버그 원인**: React Flow는 노드를 top-left 기준으로 배치하는데, 현재 사용자 노드만 오프셋(-90, -55)이 적용되고 다른 노드들은 적용되지 않아 시각적 중심 거리가 불일치
**수정 내용**: 모든 노드에 동일한 오프셋을 적용하여 시각적 중심 기준으로 정확한 거리 배치

### 기능 요약
- **연속적 반경 공식**: `targetRadius = 150 + (1 - relevance) * 430`
  - 95% → 171px (중심 가까이)
  - 70% → 279px
  - 50% → 365px
  - 30% → 451px (외곽)
- **골든 앵글 분산**: 피보나치 나선 기반으로 노드가 겹치지 않게 균등 분산
- **충돌 방지**: 노드 간 최소 거리 90px 유지
- **시각적 중심 일관성**: 모든 노드에 동일한 오프셋 적용하여 정확한 거리 배치

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/graph/forceLayout.ts` | SEARCH_LAYOUT_CONFIG 추가, 노드 오프셋 일관성 수정, 디버그 로깅 추가 |
| `src/app/(main)/network/page.tsx` | ZONE_RADII 상수 동기화, 디버그 로깅 추가 |

---

## Phase 22: 네트워크 검색 고도화
**상태: 완료**

### 목표
네트워크 페이지의 의미 검색 알고리즘 정확도 향상 및 UI/UX 개선

### 22-1. 검색 알고리즘 개선
| 작업 | 상태 | 파일 |
|------|------|------|
| 쿼리 의도 분류 시스템 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |
| 의도별 동적 가중치 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| 확장 필드 검색 지원 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| 한글 유의어 매칭 | ✅ 완료 | `src/lib/matching/koreanMatcher.ts` (신규) |
| MBTI/태그 미언급 시 대체 점수 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |

### 22-2. 시각적 개선
| 작업 | 상태 | 파일 |
|------|------|------|
| 노드 관련도 기반 스타일링 | ✅ 완료 | `src/components/graph/EnhancedUserNode.tsx` |
| 검색 결과 상세 패널 (상위 5명) | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 범례 접기 기능 | ✅ 완료 | `src/app/(main)/network/page.tsx` |

### 22-3. 동작/UX 개선
| 작업 | 상태 | 파일 |
|------|------|------|
| 상태 동기화 최적화 (useTransition) | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| Staggered 애니메이션 | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 검색 로딩 인디케이터 | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 결과 없음 UI | ✅ 완료 | `src/app/(main)/network/page.tsx` |

### 22-4. 검색 결과 영역 시각화
| 작업 | 상태 | 파일 |
|------|------|------|
| 검색 결과 티어별 그룹화 UI | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 동심원 영역 경계 (ZoneBoundaries) | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 관련도 기반 방사형 배치 강화 | ✅ 완료 | `src/lib/graph/forceLayout.ts` |
| 뷰포트 연동 (pan/zoom 동기화) | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 영역 페이드인 애니메이션 | ✅ 완료 | `src/app/globals.css` |

### 기능 요약
- **쿼리 의도 분류**: personality, skill, hobby, mbti, department, general 6가지 의도 자동 분류
- **의도별 가중치**: 검색 의도에 따라 벡터유사도, 프로필필드, MBTI, 태그, 텍스트 가중치 동적 조정
- **한글 유의어**: "개발자" → "developer, 프로그래머, 엔지니어" 등 자동 확장
- **노드 시각화**: 관련도에 따라 테두리 두께(2-5px), 색상(gray→violet), 크기(0.95-1.1x) 동적 변화
- **Staggered 애니메이션**: 관련도 높은 노드부터 순차적으로 등장
- **검색 UX**: 검색 중 로딩 표시, 결과 없을 시 안내 UI 제공
- **검색 결과 티어 분류**: 최고 매칭(70%+), 높은 매칭(50-69%), 관련 있음(30-49%) 3단계 그룹화
- **동심원 영역 경계**: 검색 시 캔버스에 관련도별 영역을 시각적으로 표시
- **방사형 노드 배치**: 관련도에 따라 중심(현재 사용자) 가까이 또는 외곽에 노드 배치
  - 공식: `targetRadius = 150 + (1 - relevance) * 300`
  - 70%: 240px, 50%: 300px, 30%: 360px

### 신규 생성 파일
| 파일 | 용도 |
|------|------|
| `src/lib/matching/koreanMatcher.ts` | 한글 유의어 사전 및 매칭 함수 |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/anthropic/queryExpansion.ts` | QueryIntent 타입, 의도 분류 로직 추가 |
| `src/lib/matching/semanticMatcher.ts` | 의도별 가중치, 확장 필드 검색, 유의어 매칭 통합 |
| `src/components/graph/EnhancedUserNode.tsx` | 관련도 기반 동적 스타일링 |
| `src/app/(main)/network/page.tsx` | 상세 패널, 범례 접기, stagger 애니메이션, 로딩/결과없음 UI |
| `src/app/api/graph/semantic-search/route.ts` | queryIntent, intentConfidence 필드 추가 |

---

## Phase 21: 기수(Cohort) 시스템 구현
**상태: 완료**

### 목표
각 기수별로 모든 데이터를 완전히 격리하는 시스템 구현. 다른 기수 간에는 메시지, 공지사항, 게시판, 캘린더 등의 데이터가 절대 공유되지 않음.

### 21-1. 데이터베이스 스키마
| 작업 | 상태 | 마이그레이션 |
|------|------|-------------|
| cohorts 테이블 생성 | ✅ 완료 | `create_cohorts_table` |
| 기존 테이블에 cohort_id 추가 | ✅ 완료 | `add_cohort_id_to_tables` |
| RLS 정책 업데이트 | ✅ 완료 | `update_rls_policies_for_cohort` |
| 공채 13기 시드 및 데이터 마이그레이션 | ✅ 완료 | `seed_cohort_13_and_migrate` |

### 21-2. 타입 및 유틸리티
| 작업 | 상태 | 파일 |
|------|------|------|
| database.ts 타입 업데이트 | ✅ 완료 | `src/types/database.ts` |
| 기수 헬퍼 함수 | ✅ 완료 | `src/lib/utils/cohort.ts` |

### 21-3. 기수 관리 API
| 작업 | 상태 | 파일 |
|------|------|------|
| 기수 목록/생성 API | ✅ 완료 | `src/app/api/admin/cohorts/route.ts` |
| 기수 상세/수정/삭제 API | ✅ 완료 | `src/app/api/admin/cohorts/[id]/route.ts` |
| 기수별 사용자 관리 API | ✅ 완료 | `src/app/api/admin/cohorts/[id]/users/route.ts` |
| 기수 선택 API | ✅ 완료 | `src/app/api/admin/cohorts/select/route.ts` |

### 21-4. 기수 관리 UI
| 작업 | 상태 | 파일 |
|------|------|------|
| CohortCard 컴포넌트 | ✅ 완료 | `src/components/admin/CohortCard.tsx` |
| CohortForm 컴포넌트 | ✅ 완료 | `src/components/admin/CohortForm.tsx` |
| CohortSelector 컴포넌트 | ✅ 완료 | `src/components/admin/CohortSelector.tsx` |
| CohortUserList 컴포넌트 | ✅ 완료 | `src/components/admin/CohortUserList.tsx` |
| MoveUserModal 컴포넌트 | ✅ 완료 | `src/components/admin/MoveUserModal.tsx` |
| 기수 관리 페이지 | ✅ 완료 | `src/app/(main)/admin/cohorts/page.tsx` |
| 기수 상세 페이지 | ✅ 완료 | `src/app/(main)/admin/cohorts/[id]/page.tsx` |

### 21-5. 인증 플로우 수정
| 작업 | 상태 | 파일 |
|------|------|------|
| 로그인 후 관리자 리다이렉트 | ✅ 완료 | `src/app/(auth)/login/page.tsx` |
| 미들웨어 기수 선택 체크 | ✅ 완료 | `src/lib/supabase/middleware.ts` |
| 사이드바 기수 관리 메뉴 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |

### 21-6. 콘텐츠 API 수정
| 작업 | 상태 | 파일 |
|------|------|------|
| 공지사항 API | ✅ 완료 | `src/app/api/announcements/route.ts` |
| 게시판 API | ✅ 완료 | `src/app/api/board/posts/route.ts` |
| 캘린더 API | ✅ 완료 | `src/app/api/calendar/route.ts` |
| 대화 API | ✅ 완료 | `src/app/api/conversations/route.ts` |

### 21-7. 기타 API 수정
| 작업 | 상태 | 파일 |
|------|------|------|
| 사용자 검색 API | ✅ 완료 | `src/app/api/search/users/route.ts` |
| 네트워크 그래프 API | ✅ 완료 | `src/app/api/graph/network/route.ts` |
| 대시보드 API | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 신입사원 관리 API | ✅ 완료 | `src/app/api/admin/employees/route.ts` |
| 내 프로필 API | ✅ 완료 | `src/app/api/profile/me/route.ts` |
| 타 사용자 프로필 API | ✅ 완료 | `src/app/api/profile/[id]/route.ts` |

### 21-8. UI 컴포넌트 추가
| 작업 | 상태 | 파일 |
|------|------|------|
| Switch 컴포넌트 | ✅ 완료 | `src/components/ui/switch.tsx` |

### 기능 요약
- **기수 소속**: 사용자당 하나의 기수만 소속 가능
- **관리자 접근**: 관리자도 기수를 선택해야 해당 기수 데이터만 접근 가능
- **기존 데이터**: 31명의 신입사원을 "공채 13기"로 자동 배정
- **기수 관리**: 기수 CRUD + 사용자 관리 (목록, 기수 이동)
- **완전한 데이터 격리**: 메시지, 공지사항, 게시판, 캘린더 등 모든 데이터가 기수별로 분리

### 관리자 플로우
```
관리자 로그인
    ↓
/admin/cohorts 리다이렉트
    ↓
기수 목록 페이지
    ├── 기수 생성 (이름, 설명)
    ├── 기수 삭제 (빈 기수만)
    ├── 기수 선택 → 쿠키 설정 → /dashboard 이동
    └── 기수 상세 → 사용자 관리 (목록, 이동)
```

---

## Phase 20: 신입사원 등록 개선
**상태: 완료**

### 목표
일괄 등록 폼에 사번 입력 필드 추가 (자동/수동 선택) 및 CSV 템플릿 개선

### 20-1. 타입 및 파싱 수정
| 작업 | 상태 | 파일 |
|------|------|------|
| NewEmployeeData에 employeeId 필드 추가 | ✅ 완료 | `src/types/employee.ts` |
| CSV 헤더 매핑 (순서, 사번 추가) | ✅ 완료 | `src/lib/utils/csv.ts` |
| 사번 필드 파싱 로직 | ✅ 완료 | `src/lib/utils/csv.ts` |

### 20-2. API 수정
| 작업 | 상태 | 파일 |
|------|------|------|
| 정적 템플릿 파일 다운로드 | ✅ 완료 | `src/app/api/admin/employees/csv/route.ts` |
| 수동 사번 중복 체크 로직 | ✅ 완료 | `src/app/api/admin/employees/route.ts` |
| 자동/수동 사번 처리 분기 | ✅ 완료 | `src/app/api/admin/employees/route.ts` |

### 20-3. UI 컴포넌트 수정
| 작업 | 상태 | 파일 |
|------|------|------|
| 사번 입력 필드 + 자동생성 체크박스 | ✅ 완료 | `src/components/admin/EmployeeRegistrationForm.tsx` |
| 미리보기 테이블에 사번 컬럼 추가 | ✅ 완료 | `src/components/admin/CSVUploadSection.tsx` |

### 새로운 CSV 형식
```csv
순서,사번,이름,부서,실,팀,전화번호,생년월일,이메일,주소,성별
1,2025001,김서연,시험자동화연구소,Cloud실,Frontend팀,010-1234-5678,1999-03-15,kim.seoyeon@suresofttech.com,서울특별시 강남구,여
```

### 기능 요약
- **사번 자동/수동 선택**: 체크박스로 자동 생성 또는 수동 입력 선택
- **수동 사번 중복 체크**: 이미 존재하는 사번 입력 시 오류 표시
- **정적 템플릿 다운로드**: `신입사원_템플릿.csv` 파일 다운로드
- **CSV 업로드 사번 처리**: 비어있으면 자동 생성, 입력되어 있으면 해당 값 사용

---

## Phase 19: 비밀번호 관리
**상태: 완료**

### 목표
신입사원 초기 비밀번호 통일 및 비밀번호 변경 기능 추가

### 19-1. 초기 비밀번호 변경
| 작업 | 상태 | 파일 |
|------|------|------|
| DEFAULT_PASSWORD 상수 정의 | ✅ 완료 | `src/lib/utils/csv.ts` |
| generateInitialPassword() 고정값 반환 | ✅ 완료 | `src/lib/utils/csv.ts` |
| 기존 31명 비밀번호 일괄 변경 | ✅ 완료 | Supabase Admin API |

### 19-2. 비밀번호 변경 기능
| 작업 | 상태 | 파일 |
|------|------|------|
| 비밀번호 변경 API | ✅ 완료 | `src/app/api/auth/change-password/route.ts` |
| 설정 페이지 비밀번호 변경 UI | ✅ 완료 | `src/app/(main)/settings/page.tsx` |

### 기능 요약
- **초기 비밀번호**: 모든 신입사원 `suresoft1!`로 통일
- **비밀번호 변경**: 설정 페이지에서 현재 비밀번호 확인 후 새 비밀번호로 변경 가능

---

## Phase 18.1: 온보딩 자동 입력
**상태: 완료**

### 목표
관리자가 신입사원 계정 생성 시 입력한 정보를 온보딩에서 자동으로 채워주는 기능

### 수정된 파일
| 작업 | 상태 | 파일 |
|------|------|------|
| InitialProfileData 타입 | ✅ 완료 | `src/types/onboarding.ts` |
| createInitialStateFromProfile 함수 | ✅ 완료 | `src/types/onboarding.ts` |
| 온보딩 페이지 프로필 조회 | ✅ 완료 | `src/app/onboarding/page.tsx` |
| OnboardingWizard initialProfile 처리 | ✅ 완료 | `src/components/onboarding/OnboardingWizard.tsx` |

### 기능 요약
- 관리자 입력 데이터 (부서, 실, 팀) 온보딩 Step 1에 자동 입력
- 신입사원은 직급, 근무지 등 추가 정보만 입력하면 됨

---

## Phase 18: 신입사원 관리 시스템
**상태: 완료**

### 목표
관리자 전용 신입사원 계정 생성 기능 구현

### 18-1. 데이터베이스 스키마
| 작업 | 상태 | 파일 |
|------|------|------|
| employee_sequences 테이블 | ✅ 완료 | `add_employee_management` 마이그레이션 |
| users 테이블 컬럼 추가 | ✅ 완료 | employee_id, phone_number, birthdate, address, gender |
| generate_employee_id() 함수 | ✅ 완료 | 사번 자동 생성 (연도+순번) |

### 18-2. API 라우트
| 작업 | 상태 | 파일 |
|------|------|------|
| 신입사원 목록/등록 API | ✅ 완료 | `src/app/api/admin/employees/route.ts` |
| CSV 파싱 API | ✅ 완료 | `src/app/api/admin/employees/csv/route.ts` |

### 18-3. UI 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| EmployeeRegistrationForm | ✅ 완료 | `src/components/admin/EmployeeRegistrationForm.tsx` |
| CSVUploadSection | ✅ 완료 | `src/components/admin/CSVUploadSection.tsx` |
| EmployeeListTable | ✅ 완료 | `src/components/admin/EmployeeListTable.tsx` |
| Table 컴포넌트 | ✅ 완료 | `src/components/ui/table.tsx` |

### 18-4. 페이지 및 네비게이션
| 작업 | 상태 | 파일 |
|------|------|------|
| 신입사원 관리 페이지 | ✅ 완료 | `src/app/(main)/admin/employees/page.tsx` |
| Sidebar 관리자 메뉴 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |

### 18-5. 유틸리티
| 작업 | 상태 | 파일 |
|------|------|------|
| CSV 파싱/생성 유틸 | ✅ 완료 | `src/lib/utils/csv.ts` |
| employee 타입 정의 | ✅ 완료 | `src/types/employee.ts` |

### 기능 요약
- **일괄 등록**: 웹 UI에서 1-30명 동시 등록
- **CSV 업로드**: 템플릿 다운로드 → 데이터 입력 → 업로드 → 미리보기 → 등록
- **자동 사번 생성**: 2025001 형식 (연도+순번)
- **초기 비밀번호**: 생년월일 기반 (예: 19950315) 또는 기본값 `sure2025`
- **이메일 도메인 검증**: @suresofttech.com 필수
- **관리자 전용**: Sidebar에 관리자 메뉴 조건부 표시

---

## Phase 18.1: 온보딩 자동 입력
**상태: 완료**

### 목표
관리자가 신입사원 계정 생성 시 입력한 정보를 온보딩에서 자동으로 채워주는 기능

### 수정된 파일
| 작업 | 상태 | 파일 |
|------|------|------|
| InitialProfileData 타입 | ✅ 완료 | `src/types/onboarding.ts` |
| createInitialStateFromProfile 함수 | ✅ 완료 | `src/types/onboarding.ts` |
| 온보딩 페이지 프로필 조회 | ✅ 완료 | `src/app/onboarding/page.tsx` |
| OnboardingWizard initialProfile 처리 | ✅ 완료 | `src/components/onboarding/OnboardingWizard.tsx` |

### 기능 요약
- 관리자 입력 데이터 (부서, 실, 팀) 온보딩 Step 1에 자동 입력
- 신입사원은 직급, 근무지 등 추가 정보만 입력하면 됨

---

## Phase 17: 조직도 기반 온보딩 시스템 업데이트
**상태: 완료**

### 목표
실제 회사 조직 구조를 반영하여 온보딩 및 프로필 시스템 업데이트

### 17-1. 데이터베이스 스키마
| 작업 | 상태 | 파일 |
|------|------|------|
| profiles 테이블 컬럼 추가 | ✅ 완료 | org_level1, org_level2, org_level3, job_position |

### 17-2. 상수 파일
| 작업 | 상태 | 파일 |
|------|------|------|
| 조직 구조 상수 | ✅ 완료 | `src/lib/constants/organization.ts` |
| 직급 상수 | ✅ 완료 | `src/lib/constants/jobPositions.ts` |
| 근무지 상수 | ✅ 완료 | `src/lib/constants/locations.ts` |

### 17-3. UI 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| OrganizationSelector | ✅ 완료 | `src/components/ui/OrganizationSelector.tsx` |
| StepBasicInfo 수정 | ✅ 완료 | `src/components/onboarding/StepBasicInfo.tsx` |
| ProfileForm 수정 | ✅ 완료 | `src/components/profile/ProfileForm.tsx` |

### 17-4. 매칭 알고리즘
| 작업 | 상태 | 파일 |
|------|------|------|
| departmentScoring 수정 | ✅ 완료 | `src/lib/matching/departmentScoring.ts` |
| jobRoleScoring 수정 | ✅ 완료 | `src/lib/matching/jobRoleScoring.ts` |

### 기능 요약
- 3단계 조직 선택: 연구소/센터 → 실 → 팀
- 새로운 직급 체계: 수석연구원, 책임연구원 등
- 조직 간 시너지 점수 매칭 알고리즘

---

---

## Phase 16: 온보딩 서비스 핵심 기능 추가
**상태: 완료**

### 목표
신입사원 온보딩 서비스에 필요한 핵심 기능(캘린더, 게시판, 공지사항) 구현

### 16-1. Role 시스템 추가
| 작업 | 상태 | 파일 |
|------|------|------|
| profiles.role 컬럼 추가 | ✅ 완료 | `add_role_column` 마이그레이션 |
| 타입 정의 업데이트 | ✅ 완료 | `src/types/database.ts`, `src/types/profile.ts` |
| Auth 헬퍼 함수 | ✅ 완료 | `src/lib/utils/auth.ts` |
| Profile API role 반환 | ✅ 완료 | `src/app/api/profile/me/route.ts` |

### 16-2. 캘린더 기능
| 작업 | 상태 | 파일 |
|------|------|------|
| calendar_events 테이블 | ✅ 완료 | `create_calendar_tables` 마이그레이션 |
| 캘린더 목록/생성 API | ✅ 완료 | `src/app/api/calendar/route.ts` |
| 캘린더 상세/수정/삭제 API | ✅ 완료 | `src/app/api/calendar/[id]/route.ts` |
| 캘린더 페이지 | ✅ 완료 | `src/app/(main)/calendar/page.tsx` |
| CalendarView 컴포넌트 | ✅ 완료 | `src/components/calendar/CalendarView.tsx` |
| EventModal 컴포넌트 | ✅ 완료 | `src/components/calendar/EventModal.tsx` |
| EventTypeFilter 컴포넌트 | ✅ 완료 | `src/components/calendar/EventTypeFilter.tsx` |

**캘린더 기능 요약**:
- 공유 일정 (교육): 관리자만 생성/수정/삭제 가능, 모든 사용자에게 표시
- 개인 일정: 본인만 생성/수정/삭제 및 조회 가능
- 월간 캘린더 뷰 + 일정 필터링

### 16-3. 게시판 기능
| 작업 | 상태 | 파일 |
|------|------|------|
| board_posts 테이블 | ✅ 완료 | `create_board_tables` 마이그레이션 |
| board_comments 테이블 | ✅ 완료 | `create_board_tables` 마이그레이션 |
| board_likes 테이블 | ✅ 완료 | `create_board_tables` 마이그레이션 |
| board_polls 테이블 | ✅ 완료 | `create_board_tables` 마이그레이션 |
| board_poll_votes 테이블 | ✅ 완료 | `create_board_tables` 마이그레이션 |
| board-images 스토리지 버킷 | ✅ 완료 | Supabase MCP |
| 게시물 목록/작성 API | ✅ 완료 | `src/app/api/board/posts/route.ts` |
| 게시물 상세/수정/삭제 API | ✅ 완료 | `src/app/api/board/posts/[id]/route.ts` |
| 좋아요 API | ✅ 완료 | `src/app/api/board/posts/[id]/like/route.ts` |
| 댓글 API | ✅ 완료 | `src/app/api/board/posts/[id]/comments/route.ts` |
| 투표 API | ✅ 완료 | `src/app/api/board/posts/[id]/vote/route.ts` |
| 게시판 목록 페이지 | ✅ 완료 | `src/app/(main)/board/page.tsx` |
| 게시물 작성 페이지 | ✅ 완료 | `src/app/(main)/board/new/page.tsx` |
| 게시물 상세 페이지 | ✅ 완료 | `src/app/(main)/board/[id]/page.tsx` |

**게시판 기능 요약**:
- 게시물 유형: 일반, 갤러리, 투표
- 좋아요, 댓글 기능
- 투표 기능 (복수 선택, 마감일 설정)
- 조회수 자동 증가

### 16-4. 공지사항 기능
| 작업 | 상태 | 파일 |
|------|------|------|
| announcements 테이블 | ✅ 완료 | `create_announcement_tables` 마이그레이션 |
| announcement_files 테이블 | ✅ 완료 | `create_announcement_tables` 마이그레이션 |
| announcement_comments 테이블 | ✅ 완료 | `create_announcement_tables` 마이그레이션 |
| announcement-files 스토리지 버킷 | ✅ 완료 | Supabase MCP (50MB 제한) |
| 공지 목록/작성 API | ✅ 완료 | `src/app/api/announcements/route.ts` |
| 공지 상세/수정/삭제 API | ✅ 완료 | `src/app/api/announcements/[id]/route.ts` |
| 공지 댓글 API | ✅ 완료 | `src/app/api/announcements/[id]/comments/route.ts` |
| 공지 목록 페이지 | ✅ 완료 | `src/app/(main)/announcements/page.tsx` |
| 공지 작성 페이지 | ✅ 완료 | `src/app/(main)/announcements/new/page.tsx` |
| 공지 상세 페이지 | ✅ 완료 | `src/app/(main)/announcements/[id]/page.tsx` |

**공지사항 기능 요약**:
- 관리자만 공지 작성/수정/삭제 가능
- 카테고리: 공지, 교육, 이벤트
- 중요 공지 표시, 상단 고정 기능
- 파일 첨부 및 다운로드 (최대 50MB)
- 모든 사용자 댓글 가능

### 16-5. 사이드바 업데이트
| 작업 | 상태 | 파일 |
|------|------|------|
| 캘린더 메뉴 추가 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |
| 게시판 메뉴 추가 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |
| 공지사항 메뉴 추가 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |

### 16-6. 대시보드 API 업데이트
| 작업 | 상태 | 파일 |
|------|------|------|
| clubs 관련 코드 제거 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 최근 공지사항 조회 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 다가오는 일정 조회 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 최근 게시물 조회 | ✅ 완료 | `src/app/api/dashboard/route.ts` |

### 적용된 마이그레이션 (5개)
| 순서 | 마이그레이션명 | 내용 |
|------|---------------|------|
| 1 | `add_role_column` | profiles.role 컬럼 추가 |
| 2 | `create_calendar_tables` | 캘린더 이벤트 테이블 + RLS |
| 3 | `create_board_tables` | 게시판 테이블들 + 트리거 함수 + RLS |
| 4 | `create_announcement_tables` | 공지사항 테이블들 + 트리거 함수 + RLS |
| 5 | `create_view_count_rpc_functions` | 조회수 증가 RPC 함수 |

### 신규 생성 파일 (26개)
| 카테고리 | 파일 | 용도 |
|---------|------|------|
| Auth | `src/lib/utils/auth.ts` | 관리자 권한 체크 헬퍼 |
| Calendar API | `src/app/api/calendar/route.ts` | 캘린더 목록/생성 |
| Calendar API | `src/app/api/calendar/[id]/route.ts` | 캘린더 상세/수정/삭제 |
| Calendar Page | `src/app/(main)/calendar/page.tsx` | 캘린더 페이지 |
| Calendar Component | `src/components/calendar/CalendarView.tsx` | 월간 캘린더 뷰 |
| Calendar Component | `src/components/calendar/EventModal.tsx` | 일정 생성/수정 모달 |
| Calendar Component | `src/components/calendar/EventTypeFilter.tsx` | 일정 유형 필터 |
| Board API | `src/app/api/board/posts/route.ts` | 게시물 목록/작성 |
| Board API | `src/app/api/board/posts/[id]/route.ts` | 게시물 상세/수정/삭제 |
| Board API | `src/app/api/board/posts/[id]/like/route.ts` | 좋아요 토글 |
| Board API | `src/app/api/board/posts/[id]/comments/route.ts` | 댓글 CRUD |
| Board API | `src/app/api/board/posts/[id]/vote/route.ts` | 투표 참여 |
| Board Page | `src/app/(main)/board/page.tsx` | 게시판 목록 |
| Board Page | `src/app/(main)/board/new/page.tsx` | 게시물 작성 |
| Board Page | `src/app/(main)/board/[id]/page.tsx` | 게시물 상세 |
| Announcement API | `src/app/api/announcements/route.ts` | 공지 목록/작성 |
| Announcement API | `src/app/api/announcements/[id]/route.ts` | 공지 상세/수정/삭제 |
| Announcement API | `src/app/api/announcements/[id]/comments/route.ts` | 공지 댓글 |
| Announcement Page | `src/app/(main)/announcements/page.tsx` | 공지 목록 |
| Announcement Page | `src/app/(main)/announcements/new/page.tsx` | 공지 작성 |
| Announcement Page | `src/app/(main)/announcements/[id]/page.tsx` | 공지 상세 |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `src/types/database.ts` | role 타입, RPC 함수 타입 추가 |
| `src/types/profile.ts` | role 필드 추가 |
| `src/app/api/profile/me/route.ts` | role 반환 |
| `src/components/layout/Sidebar.tsx` | 캘린더, 게시판, 공지사항 메뉴 추가 |
| `src/app/api/dashboard/route.ts` | clubs 제거, 새 기능 데이터 추가 |
| `src/app/api/search/users/route.ts` | VisibilitySettings 타입 import |

---

## Phase 15: 신입사원 온보딩 서비스 피벗
**상태: 완료**

### 목표
sureUs를 대규모 공채 신입사원을 위한 아이스 브레이킹 및 온보딩 서비스로 리포지셔닝

### 15-1. 불필요한 기능 삭제
| 작업 | 상태 | 삭제 대상 |
|------|------|----------|
| 사이드바 메뉴 수정 | ✅ 완료 | 추천, 동호회 메뉴 항목 제거 |
| 동호회 페이지 삭제 | ✅ 완료 | `src/app/(main)/clubs/` 전체 |
| 동호회 API 삭제 | ✅ 완료 | `src/app/api/clubs/` 전체 |
| 동호회 컴포넌트 삭제 | ✅ 완료 | `src/components/clubs/` 전체 |
| ClubContext 삭제 | ✅ 완료 | `src/contexts/ClubContext.tsx` |
| 동호회 Lib 삭제 | ✅ 완료 | `src/lib/clubs/` 전체 |
| 추천 페이지 삭제 | ✅ 완료 | `src/app/(main)/recommendations/` |
| 추천 API 삭제 | ✅ 완료 | `src/app/api/match/recommendations/` |
| match 타입 삭제 | ✅ 완료 | `src/types/match.ts` |

### 유지된 기능 (다른 기능에서 사용)
- `src/lib/matching/` - 네트워크 시각화, 검색 기능에서 계속 사용

### 삭제된 파일 수
| 카테고리 | 삭제 수 |
|---------|---------|
| 페이지 | ~15개 |
| API 라우트 | ~20개 |
| 컴포넌트 | ~10개 |
| Context | 1개 |
| Lib | 2개 |
| Types | 1개 |
| **총계** | **~49개** |

### 변경된 파일
- `src/components/layout/Sidebar.tsx` - 메뉴 항목 제거

---

## Phase 14: 프로젝트 진단 및 개선
**상태: 완료**

### 진단 결과 요약

| 항목 | Before | After | 상태 |
|------|--------|-------|------|
| 임베딩 보유 프로필 | 4/34 (12%) | 34/34 (100%) | ✅ 해결 |
| 보안 취약 함수 (search_path) | 7개 | 0개 | ✅ 해결 |
| RLS 성능 이슈 정책 | 40+개 | 0개 | ✅ 해결 |
| 누락 FK 인덱스 | 4개 | 0개 | ✅ 해결 |
| 온보딩 상태 불일치 | 34개 | 0개 | ✅ 해결 |

### 14-1. 임베딩 동기화 문제 해결
| 작업 | 상태 | 파일 |
|------|------|------|
| Fallback 임베딩 로직 추가 | ✅ 완료 | `src/lib/openai/embeddings.ts` |
| Profile API Fallback 적용 (POST) | ✅ 완료 | `src/app/api/profile/route.ts` |
| Profile API Fallback 적용 (PUT) | ✅ 완료 | `src/app/api/profile/route.ts` |
| 임베딩 일괄 재생성 스크립트 | ✅ 완료 | `src/scripts/regenerate-embeddings.ts` |
| 30개 누락 임베딩 생성 | ✅ 완료 | 스크립트 실행 (30/30 성공) |

**근본 원인**: 프로필 텍스트 필드(협업스타일, 강점 등)가 없을 경우 임베딩 생성 안됨

**해결**: 텍스트 필드가 없을 때 기본 정보(부서, 직군, MBTI, 취미 태그)로 Fallback 임베딩 생성
```typescript
// Fallback 텍스트 형식
"부서: ${department} | 직군: ${jobRole} | MBTI: ${mbti} | 취미: ${hobbies.join(', ')}"
```

### 14-2. 보안 취약점 수정
| 작업 | 상태 | 마이그레이션 |
|------|------|------|
| 7개 함수 search_path 수정 | ✅ 완료 | `fix_function_search_paths_v2` |

수정된 함수 목록:
- `check_field_visibility`
- `update_updated_at`
- `update_post_like_count`
- `update_post_comment_count`
- `calculate_tag_overlap`
- `get_common_tags`
- `update_club_member_count`

### 14-3. RLS 정책 성능 최적화
| 작업 | 상태 | 마이그레이션 |
|------|------|------|
| users RLS 최적화 | ✅ 완료 | `optimize_rls_policies_part1` |
| profiles RLS 최적화 | ✅ 완료 | `optimize_rls_policies_part2` |
| profile_tags/embeddings RLS 최적화 | ✅ 완료 | `optimize_rls_policies_part3` |
| conversations/messages RLS 최적화 | ✅ 완료 | `optimize_rls_policies_part4` |
| notifications/matches_cache RLS 최적화 | ✅ 완료 | `optimize_rls_policies_part5` |
| clubs/club_* RLS 최적화 | ✅ 완료 | `optimize_rls_policies_part6` |

**개선 내용**: `auth.uid()` → `(SELECT auth.uid())` 변경 (매 행 재평가 방지)

### 14-4. 데이터 정규화
| 작업 | 상태 | 마이그레이션 |
|------|------|------|
| 온보딩 상태 정규화 | ✅ 완료 | `normalize_onboarding_status` |
| FK 인덱스 추가 | ✅ 완료 | `add_missing_fk_indexes` |

추가된 인덱스:
- `idx_club_join_requests_reviewed_by`
- `idx_club_likes_user_id`
- `idx_matches_cache_matched_user_id`
- `idx_messages_sender_id`

### 적용된 마이그레이션 (9개)
| 순서 | 마이그레이션명 | 내용 |
|------|---------------|------|
| 1 | `normalize_onboarding_status` | 온보딩 상태 정규화 |
| 2 | `fix_function_search_paths_v2` | 7개 함수 보안 수정 |
| 3 | `optimize_rls_policies_part1` | users RLS 최적화 |
| 4 | `optimize_rls_policies_part2` | profiles RLS 최적화 |
| 5 | `optimize_rls_policies_part3` | profile_tags/embeddings RLS 최적화 |
| 6 | `optimize_rls_policies_part4` | conversations/messages RLS 최적화 |
| 7 | `optimize_rls_policies_part5` | notifications/matches_cache RLS 최적화 |
| 8 | `optimize_rls_policies_part6` | clubs/club_* RLS 최적화 |
| 9 | `add_missing_fk_indexes` | 4개 FK 인덱스 추가 |

### 신규 생성 파일
| 파일 | 용도 |
|------|------|
| `src/scripts/regenerate-embeddings.ts` | 임베딩 일괄 재생성 CLI 스크립트 |

### 스크립트 사용법
```bash
# 임베딩 없는 프로필에 대해 일괄 재생성
npx tsx src/scripts/regenerate-embeddings.ts
```

---

## Phase 1: 프로젝트 관리 설정
**상태: 완료**

| 작업 | 상태 | 비고 |
|------|------|------|
| CLAUDE.md 생성 | ✅ 완료 | 작업 규칙 정의 |
| phase.md 생성 | ✅ 완료 | 현재 파일 |

---

## Phase 2: 핵심 기능 완성
**상태: 완료**

| 작업 | 상태 | 파일 |
|------|------|------|
| 임베딩 자동 생성 | ✅ 완료 | `src/app/api/profile/route.ts` |
| 타 사용자 프로필 API | ✅ 완료 | `src/app/api/profile/[id]/route.ts` |
| 타 사용자 프로필 페이지 | ✅ 완료 | `src/app/(main)/profile/[id]/page.tsx` |

---

## Phase 3: 알림 시스템
**상태: 완료**

| 작업 | 상태 | 파일 |
|------|------|------|
| notifications 테이블 | ✅ 완료 | Supabase MCP |
| 알림 API | ✅ 완료 | `src/app/api/notifications/route.ts` |
| NotificationBell 컴포넌트 | ✅ 완료 | `src/components/layout/NotificationBell.tsx` |
| Header에 알림 벨 추가 | ✅ 완료 | `src/components/layout/Header.tsx` |

---

## Phase 4: 1:1 메시지 시스템
**상태: 완료**

| 작업 | 상태 | 파일 |
|------|------|------|
| conversations 테이블 | ✅ 완료 | Supabase MCP |
| messages 테이블 | ✅ 완료 | Supabase MCP |
| 대화 API | ✅ 완료 | `src/app/api/conversations/*` |
| 메시지 목록 페이지 | ✅ 완료 | `src/app/(main)/messages/page.tsx` |
| 대화 상세 페이지 | ✅ 완료 | `src/app/(main)/messages/[id]/page.tsx` |
| Sidebar 메시지 메뉴 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |

---

## Phase 5: 테스트 및 배포
**상태: 완료**

| 작업 | 상태 | 비고 |
|------|------|------|
| 빌드 확인 | ✅ 완료 | |
| Git 커밋 | ✅ 완료 | 4d3d0ed |
| Railway 배포 | ✅ 완료 | |
| 버그 수정 | ✅ 완료 | /api/user GET, 임베딩 JSON 파싱 |

---

## Phase 6: 알고리즘 및 시각화 고도화
**상태: 완료**

### 6-1. 고도화된 점수 알고리즘
| 작업 | 상태 | 파일 |
|------|------|------|
| MBTI 궁합 매트릭스 | ✅ 완료 | `src/lib/matching/mbtiCompatibility.ts` |
| 직군 점수 시스템 | ✅ 완료 | `src/lib/matching/jobRoleScoring.ts` |
| 부서/위치 점수 | ✅ 완료 | `src/lib/matching/departmentScoring.ts`, `locationScoring.ts` |
| DB 마이그레이션 | ✅ 완료 | Supabase MCP |
| 통합 알고리즘 | ✅ 완료 | `src/lib/matching/enhancedAlgorithm.ts` |

### 6-2. 다중 기준 클러스터링
| 작업 | 상태 | 파일 |
|------|------|------|
| 클러스터링 로직 | ✅ 완료 | `src/lib/graph/clustering.ts` |
| 레이아웃 알고리즘 | ✅ 완료 | `src/lib/graph/layout.ts` |
| Network API 수정 | ✅ 완료 | `src/app/api/graph/network/route.ts` |

### 6-3. 인터랙티브 시각화
| 작업 | 상태 | 파일 |
|------|------|------|
| 호버 하이라이트 | ✅ 완료 | `src/hooks/useGraphInteraction.ts` |
| 유사도 필터 슬라이더 | ✅ 완료 | `src/components/graph/SimilarityFilter.tsx` |
| 클러스터 확장/축소 컨트롤 | ✅ 완료 | `src/components/graph/GraphControls.tsx` |
| 향상된 노드 컴포넌트 | ✅ 완료 | `src/components/graph/EnhancedUserNode.tsx` |
| 커스텀 엣지 | ✅ 완료 | `src/components/graph/CustomEdge.tsx` |
| Network 페이지 통합 | ✅ 완료 | `src/app/(main)/network/page.tsx` |

---

## 완료된 기능

### 인증
- [x] Supabase Auth 연동
- [x] 이메일/비밀번호 로그인
- [x] 미들웨어 세션 관리

### 프로필
- [x] 프로필 CRUD API
- [x] 프로필 수정 페이지
- [x] 취미 태그 시스템
- [x] 임베딩 자동 생성 (Fallback 지원)
- [x] 타 사용자 프로필 보기
- [x] 11개 확장 프로필 필드 (개인정보, 업무정보, 관심사, 커리어)
- [x] 태그 직접입력 기능
- [x] 필드별 공개 범위 설정
- [x] AI 태그 추천 기능
- [x] AI 프로필 작성 도움 기능 (협업스타일, 강점, 선호동료, 업무설명, 커리어목표)
- [x] 임베딩 일괄 재생성 스크립트

### 온보딩
- [x] 8단계 온보딩 wizard
- [x] Framer Motion 애니메이션
- [x] MBTI 선택 카드 (4x4 그리드)
- [x] 취미 태그 다중 선택 (최대 10개)
- [x] AI 도움 버튼 통합
- [x] 그라데이션 배경 + Glass morphism
- [x] 진행률 바 (상단 고정)
- [x] 회원가입 후 온보딩 리다이렉트

### 검색
- [x] 동료 검색 API
- [x] 검색 페이지 UI
- [x] 필터 (부서, 직군, 근무지)

### 추천
- [x] 매칭 알고리즘 (임베딩 + 태그 + 선호도)
- [x] 추천 API
- [x] 추천 페이지 UI

### 네트워크
- [x] 네트워크 그래프 API
- [x] React Flow 시각화

### 알림
- [x] 알림 테이블 및 RLS
- [x] 알림 API
- [x] 알림 벨 UI

### 메시지
- [x] 대화/메시지 테이블
- [x] 대화 API
- [x] 메시지 목록/상세 UI
- [x] 메시지 알림 연동

### 설정
- [x] 계정 삭제 기능
- [x] 설정 페이지

### 데이터베이스
- [x] 36개 마이그레이션 적용 (Phase 14에서 9개 추가)
- [x] RLS 정책 설정 및 성능 최적화
- [x] pgvector 인덱스
- [x] 보안 함수 search_path 수정
- [x] FK 인덱스 추가

---

## 변경 이력

| 날짜 | Phase | 변경 내용 |
|------|-------|----------|
| 2025-12-15 | 1 | CLAUDE.md, phase.md 생성 |
| 2025-12-15 | 2 | 임베딩 자동 생성, 타 사용자 프로필 |
| 2025-12-15 | 3 | 알림 시스템 구현 |
| 2025-12-15 | 4 | 1:1 메시지 시스템 구현 |
| 2025-12-15 | 5 | /api/user GET 추가, 임베딩 JSON 파싱 수정 |
| 2025-12-15 | 6 | 알고리즘 고도화 시작 |
| 2025-12-15 | 6 | 7컴포넌트 점수 알고리즘, 클러스터링, 인터랙티브 시각화 완료 |
| 2025-12-15 | 7 | 동호회 기능 구현 시작 |
| 2025-12-16 | 7 | 투표 기능, 갤러리 기능, 추천 알고리즘, LLM 통합 완료 |
| 2025-12-16 | 7 | member_count 버그 수정, 탭 네비게이션 성능 최적화 (ClubContext) |
| 2025-12-16 | 8 | 네트워크 의미 검색 기능 구현 (Claude 쿼리 확장 + 벡터 검색) |
| 2025-12-16 | 8 | 의미 검색 유사도 필터 슬라이더 추가 |
| 2025-12-16 | 9 | 대시보드 UI 전면 개편 (그라데이션 히어로, 통계, 활동 피드) |
| 2025-12-16 | 10 | 대시보드 기능 확장 (프로필 완성도, 추천 동료, 동호회 추천, 진행 중 투표) |
| 2025-12-16 | 10 | 네트워크 페이지 레이아웃 개선 (통계/범례 하단 이동, 필터/검색 우측 상단 배치) |
| 2025-12-16 | 10 | 의미 검색 정확도 개선 (프로필 필드 중심 매칭, 확장 최소화) |
| 2025-12-16 | 10 | 의미 검색 모드 옵션 추가 (정확하게 찾기 / 넓게 찾기) |
| 2025-12-16 | 10 | 대시보드 추천 동료 Enhanced Algorithm 적용 (7요소 점수 알고리즘) |
| 2025-12-16 | 11 | 프로필 필드 확장 (11개 필드 추가, 태그 직접입력, 임베딩 연동) |
| 2025-12-16 | 12 | 프로필 LLM 도움 기능 (AI 태그 추천, AI 텍스트 생성) |
| 2025-12-16 | 13 | 온보딩 플로우 구현 (8단계 wizard, Framer Motion 애니메이션) |
| 2025-12-17 | 14 | 프로젝트 진단 및 개선 (임베딩 88% 복구, 보안 수정, RLS 최적화) |
| 2025-12-17 | 15 | 신입사원 온보딩 서비스 피벗 (동호회, 추천 기능 삭제) |
| 2025-12-17 | 16 | 온보딩 서비스 핵심 기능 추가 (캘린더, 게시판, 공지사항, Role 시스템) |
| 2025-12-17 | 17 | 조직도 기반 온보딩 시스템 업데이트 (3단계 조직 선택, 직급 체계) |
| 2025-12-17 | 18 | 신입사원 관리 시스템 (일괄 등록, CSV 업로드, 사번 자동 생성) |
| 2025-12-17 | 18.1 | 온보딩 자동 입력 (관리자 입력 데이터 자동 채움) |
| 2025-12-18 | 19 | 비밀번호 관리 (초기 비밀번호 통일, 비밀번호 변경 기능) |
| 2025-12-18 | 20 | 신입사원 등록 개선 (사번 자동/수동 선택, CSV 템플릿 개선) |
| 2025-12-18 | 21 | 기수 시스템 구현 (기수별 데이터 완전 격리, 관리자 기수 선택, 기수 관리 UI) |
| 2025-12-19 | 22 | 네트워크 검색 고도화 (쿼리 의도 분류, 한글 유의어, 동적 가중치, stagger 애니메이션, 개선된 UI) |

---

## Phase 13: 온보딩 플로우 구현
**상태: 완료**

### 13-1. 기반 설정
| 작업 | 상태 | 파일 |
|------|------|------|
| Framer Motion 설치 | ✅ 완료 | `package.json` |
| 애니메이션 유틸리티 | ✅ 완료 | `src/lib/animations.ts` |
| 온보딩 타입 정의 | ✅ 완료 | `src/types/onboarding.ts` |

### 13-2. 온보딩 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| ProgressBar | ✅ 완료 | `src/components/onboarding/ProgressBar.tsx` |
| StepWelcome | ✅ 완료 | `src/components/onboarding/StepWelcome.tsx` |
| StepBasicInfo | ✅ 완료 | `src/components/onboarding/StepBasicInfo.tsx` |
| MbtiCard | ✅ 완료 | `src/components/onboarding/MbtiCard.tsx` |
| StepMbti | ✅ 완료 | `src/components/onboarding/StepMbti.tsx` |
| StepPersonalInfo | ✅ 완료 | `src/components/onboarding/StepPersonalInfo.tsx` |
| StepWorkInfo | ✅ 완료 | `src/components/onboarding/StepWorkInfo.tsx` |
| HobbyTag | ✅ 완료 | `src/components/onboarding/HobbyTag.tsx` |
| StepHobbies | ✅ 완료 | `src/components/onboarding/StepHobbies.tsx` |
| StepIntroduction | ✅ 완료 | `src/components/onboarding/StepIntroduction.tsx` |
| StepComplete | ✅ 완료 | `src/components/onboarding/StepComplete.tsx` |
| OnboardingWizard | ✅ 완료 | `src/components/onboarding/OnboardingWizard.tsx` |

### 13-3. 라우팅 및 인프라
| 작업 | 상태 | 파일 |
|------|------|------|
| 온보딩 페이지 | ✅ 완료 | `src/app/(auth)/onboarding/page.tsx` |
| 회원가입 리다이렉트 | ✅ 완료 | `src/app/(auth)/signup/page.tsx` |
| 미들웨어 업데이트 | ✅ 완료 | `src/lib/supabase/middleware.ts` |
| Profile API PUT 메서드 | ✅ 완료 | `src/app/api/profile/route.ts` |
| globals.css 배경 스타일 | ✅ 완료 | `src/app/globals.css` |
| onboarding_completed 컬럼 | ✅ 완료 | Supabase MCP |

### 온보딩 단계 (8단계)
| 단계 | 화면 | 필드 | 필수 여부 |
|------|------|------|----------|
| 0 | Welcome | 환영 메시지, 서비스 소개 | - |
| 1 | 기본 정보 | 부서, 직군, 근무지 | **필수** |
| 2 | MBTI | MBTI 16개 카드 선택 | 선택 |
| 3 | 개인 정보 | 연령대, 사는 곳, 고향, 학교 | 선택 |
| 4 | 업무 정보 | 업무 설명, 기술 스택, 자격증, 언어 | 선택 |
| 5 | 취미/관심사 | 취미 태그, 관심 분야, 좋아하는 음식 | 선택 |
| 6 | 자기 소개 | 협업 스타일, 강점, 선호 동료, 커리어 목표 | 선택 |
| 7 | 완료 | 프로필 미리보기, 완료 축하 | - |

### 기능 요약
- **Framer Motion 애니메이션**: 페이지 전환, 카드 등장 stagger, 선택 효과, 진행률 바
- **8단계 wizard**: 단계별 진행으로 사용자 부담 감소
- **필수/선택 구분**: Step 1만 필수, 나머지는 건너뛰기 가능
- **AI 도움 버튼**: 업무 설명, 협업 스타일, 강점, 선호 동료, 커리어 목표 필드
- **그라데이션 배경**: 전체 화면 animated gradient + Glass morphism 카드
- **진행률 표시**: 상단 고정 프로그레스 바
- **Set 기반 다중 선택**: 취미 태그 최대 10개 선택, 직접 입력 가능
- **MBTI 카드 그리드**: 4x4 레이아웃, 선택 시 체크마크 애니메이션
- **Spring 트랜지션**: 자연스러운 물리 기반 애니메이션

### 사용자 플로우
```
/signup (회원가입)
    ↓
/onboarding (8단계 wizard)
    ↓ Step 0: 환영
    ↓ Step 1: 기본 정보 (필수)
    ↓ Step 2-6: 선택 정보
    ↓ Step 7: 완료
    ↓ (프로필 저장, onboarding_completed = true)
/dashboard (대시보드)
```

---

## Phase 12: 프로필 LLM 도움 기능
**상태: 완료**

### 12-1. 프로필 도움 모듈
| 작업 | 상태 | 파일 |
|------|------|------|
| ProfileContext 인터페이스 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| suggestHobbyTags 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| generateCollaborationStyle 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| generateStrengths 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| generatePreferredPeopleType 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| generateWorkDescription 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| generateCareerGoals 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |
| generateProfileText 통합 함수 | ✅ 완료 | `src/lib/anthropic/profileAssistant.ts` |

### 12-2. API 엔드포인트
| 작업 | 상태 | 파일 |
|------|------|------|
| 태그 추천 API | ✅ 완료 | `src/app/api/profile/suggest-tags/route.ts` |
| 텍스트 생성 API | ✅ 완료 | `src/app/api/profile/generate-text/route.ts` |

### 12-3. UI 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| LLMAssistButton 컴포넌트 | ✅ 완료 | `src/components/profile/LLMAssistButton.tsx` |
| TagSuggestButton 컴포넌트 | ✅ 완료 | `src/components/profile/TagSuggestButton.tsx` |
| ProfileForm 통합 | ✅ 완료 | `src/components/profile/ProfileForm.tsx` |

### 기능 요약
- **AI 태그 추천**: 프로필 컨텍스트 기반으로 취미 태그 5개 추천
  - 부서, 직군, MBTI, 기술스택 등 기존 프로필 정보 활용
  - 이미 선택한 태그와 중복되지 않는 태그 추천
  - 추천 이유 설명 제공

- **AI 텍스트 생성**: 5개 텍스트 필드 작성 도움
  - 협업 스타일 (collaborationStyle)
  - 장점/강점 (strengths)
  - 선호하는 동료 유형 (preferredPeopleType)
  - 부서에서 하는 일 (workDescription)
  - 커리어 목표 (careerGoals)
  - 기본 제안 + 2개 대안 제공
  - 사용자가 선택 후 직접 수정 가능

- **UI/UX**:
  - 각 필드 라벨 옆 "AI 도움" 버튼
  - 모달 다이얼로그로 제안 내용 표시
  - "다시 생성" 버튼으로 재생성 가능
  - 선택 적용 또는 취소 옵션

> **참고**: Claude API (ANTHROPIC_API_KEY) 필요

---

## Phase 11: 프로필 필드 확장
**상태: 완료**

### 11-1. 데이터베이스 스키마 확장
| 작업 | 상태 | 파일/설명 |
|------|------|------|
| profiles 테이블 11개 컬럼 추가 | ✅ 완료 | Supabase MCP - `add_profile_extended_fields` |
| VisibilitySettings 확장 | ✅ 완료 | `src/types/database.ts` |

### 11-2. 타입 및 검증 스키마
| 작업 | 상태 | 파일 |
|------|------|------|
| ProfileRow 타입 업데이트 | ✅ 완료 | `src/types/database.ts` |
| UserProfile 인터페이스 업데이트 | ✅ 완료 | `src/types/profile.ts` |
| profileFormSchema 확장 | ✅ 완료 | `src/lib/utils/validation.ts` |
| visibilitySettingsSchema 확장 | ✅ 완료 | `src/lib/utils/validation.ts` |

### 11-3. API 업데이트
| 작업 | 상태 | 파일 |
|------|------|------|
| Profile 생성/수정 API | ✅ 완료 | `src/app/api/profile/route.ts` |
| 내 프로필 조회 API | ✅ 완료 | `src/app/api/profile/me/route.ts` |
| 타 사용자 프로필 API (visibility 적용) | ✅ 완료 | `src/app/api/profile/[id]/route.ts` |

### 11-4. UI 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| TagInput 직접입력 기능 | ✅ 완료 | `src/components/profile/TagInput.tsx` |
| ProfileForm 새 섹션 추가 | ✅ 완료 | `src/components/profile/ProfileForm.tsx` |
| 내 프로필 페이지 업데이트 | ✅ 완료 | `src/app/(main)/profile/page.tsx` |
| 타 사용자 프로필 페이지 업데이트 | ✅ 완료 | `src/app/(main)/profile/[id]/page.tsx` |

### 11-5. 임베딩 및 매칭 알고리즘
| 작업 | 상태 | 파일 |
|------|------|------|
| generateProfileEmbeddings 확장 | ✅ 완료 | `src/lib/openai/embeddings.ts` |
| SemanticSearchCandidate 타입 확장 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| 텍스트 매칭 검색 대상 확장 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| semantic-search API 후보 객체 업데이트 | ✅ 완료 | `src/app/api/graph/semantic-search/route.ts` |

### 추가된 프로필 필드 (11개)
| 필드명 | DB 컬럼 | 카테고리 |
|--------|---------|----------|
| 연령대 | `age_range` | 개인 정보 |
| 사는 곳 | `living_location` | 개인 정보 |
| 고향 | `hometown` | 개인 정보 |
| 학교 | `education` | 개인 정보 |
| 부서에서 하는 일 | `work_description` | 업무 정보 |
| 기술 스택 | `tech_stack` | 업무 정보 |
| 자격증 | `certifications` | 업무 정보 |
| 언어 능력 | `languages` | 업무 정보 |
| 관심 분야 | `interests` | 취미/관심사 |
| 좋아하는 음식 | `favorite_food` | 취미/관심사 |
| 커리어 목표 | `career_goals` | 자기 소개 |

### 기능 요약
- **11개 새 프로필 필드**: 개인 정보, 업무 정보, 취미/관심사, 커리어 목표 카테고리
- **태그 직접입력**: 추천 태그 선택 + 자유 입력 가능 (Enter 키 또는 + 버튼)
- **필드별 공개 범위 설정**: 전체 공개/부서 내/비공개 선택 가능
- **임베딩 연동**: workDescription, techStack, interests, careerGoals 필드를 combined_embedding에 포함
- **검색 연동**: 새 필드들이 의미 검색 텍스트 매칭 대상에 포함

---

## Phase 10: 대시보드 기능 확장 + 네트워크 개선
**상태: 완료**

### 10-1. 대시보드 API 확장
| 작업 | 상태 | 파일 |
|------|------|------|
| 프로필 완성도 계산 로직 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 진행 중인 투표 조회 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 추천 동료 미리보기 데이터 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 추천 동호회 데이터 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| Enhanced Algorithm 적용 (추천 동료) | ✅ 완료 | `src/app/api/dashboard/route.ts` |

### 10-2. 대시보드 UI 확장
| 작업 | 상태 | 파일 |
|------|------|------|
| 프로필 완성도 진행률 배너 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 추천 동료 카드 섹션 (3명) | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 추천 동호회 섹션 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 진행 중인 투표 섹션 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |

### 10-3. 네트워크 페이지 레이아웃 개선
| 작업 | 상태 | 파일 |
|------|------|------|
| 통계/범례 섹션 하단 이동 | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 필터/검색 섹션 우측 상단 배치 | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 레이아웃 그리드 재구성 | ✅ 완료 | `src/app/(main)/network/page.tsx` |

### 10-4. 의미 검색 정확도 개선
| 작업 | 상태 | 파일 |
|------|------|------|
| 쿼리 확장 최소화 프롬프트 수정 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |
| profileFieldHints 추가 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |
| 가중치 재조정 (프로필 필드 40%) | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| 프로필 필드 직접 매칭 로직 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |

### 10-5. 의미 검색 모드 옵션
| 작업 | 상태 | 파일 |
|------|------|------|
| createExactSearchQuery() 함수 추가 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |
| API searchMode 파라미터 처리 | ✅ 완료 | `src/app/api/graph/semantic-search/route.ts` |
| 검색 모드 토글 UI | ✅ 완료 | `src/components/graph/SemanticSearch.tsx` |

### 기능 요약
- **프로필 완성도**: 8개 필드 기준 0-100% 진행률 표시, 미완성 필드 안내
- **추천 동료**: Enhanced Algorithm 7요소 점수 기반 상위 3명 카드 형태로 표시
  - 임베딩 유사도 30%, 태그 중첩 25%, MBTI 궁합 12%, 직군 10%, 부서 8%, 위치 5%, 선호도 10%
- **추천 동호회**: 미가입 동호회 중 인기 동호회 3개 표시
- **진행 중인 투표**: 내 동호회의 미참여 투표, 마감시간 표시
- **네트워크 레이아웃**: 그래프 좌측, 필터/검색 우측, 통계/범례 하단 배치
- **의미 검색 정확도 개선**: 협업 스타일/강점/선호 동료 필드 중심 매칭, MBTI/태그 확장 최소화
- **의미 검색 모드 옵션**: 정확하게 찾기(LLM 확장 없음) / 넓게 찾기(AI 확장) 선택 가능

---

## Phase 9: 대시보드 개선
**상태: 완료**

### 9-1. 대시보드 API
| 작업 | 상태 | 파일 |
|------|------|------|
| Dashboard API 엔드포인트 | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 통계 데이터 집계 (메시지, 알림, 동호회) | ✅ 완료 | `src/app/api/dashboard/route.ts` |
| 최근 동호회 게시물 조회 | ✅ 완료 | `src/app/api/dashboard/route.ts` |

### 9-2. 대시보드 UI
| 작업 | 상태 | 파일 |
|------|------|------|
| 프로필 카드 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 통계 링크 (메시지, 추천, 동호회, 알림) | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 동호회 최근글 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 내 동호회 목록 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |
| 최근 알림 | ✅ 완료 | `src/app/(main)/dashboard/page.tsx` |

---

## Phase 7: 동호회(Club) 기능 구현
**상태: 완료**

### 7-1. 데이터베이스 스키마
| 작업 | 상태 | 파일/설명 |
|------|------|------|
| clubs 테이블 | ✅ 완료 | Supabase MCP |
| club_members 테이블 | ✅ 완료 | Supabase MCP |
| club_join_requests 테이블 | ✅ 완료 | Supabase MCP |
| club_posts 테이블 | ✅ 완료 | Supabase MCP |
| club_comments 테이블 | ✅ 완료 | Supabase MCP |
| club_likes 테이블 | ✅ 완료 | Supabase MCP |
| club_polls 테이블 | ✅ 완료 | Supabase MCP |
| club_poll_votes 테이블 | ✅ 완료 | Supabase MCP |
| club_chat_messages 테이블 | ✅ 완료 | Supabase MCP |
| RLS 정책 | ✅ 완료 | Supabase MCP |
| Realtime publication | ✅ 완료 | Supabase MCP |

### 7-2. 동호회 기본 API
| 작업 | 상태 | 파일 |
|------|------|------|
| 동호회 목록/생성 | ✅ 완료 | `src/app/api/clubs/route.ts` |
| 동호회 상세/수정/삭제 | ✅ 완료 | `src/app/api/clubs/[id]/route.ts` |
| 가입/탈퇴 | ✅ 완료 | `src/app/api/clubs/[id]/join/route.ts`, `leave/route.ts` |
| 회원 목록/강퇴 | ✅ 완료 | `src/app/api/clubs/[id]/members/*` |
| 가입 신청 관리 | ✅ 완료 | `src/app/api/clubs/[id]/requests/*` |

### 7-3. 게시판 API
| 작업 | 상태 | 파일 |
|------|------|------|
| 게시물 목록/작성 | ✅ 완료 | `src/app/api/clubs/[id]/posts/route.ts` |
| 게시물 상세/수정/삭제 | ✅ 완료 | `src/app/api/clubs/[id]/posts/[postId]/route.ts` |
| 댓글 CRUD | ✅ 완료 | `src/app/api/clubs/[id]/posts/[postId]/comments/route.ts` |
| 좋아요 토글 | ✅ 완료 | `src/app/api/clubs/[id]/posts/[postId]/like/route.ts` |

### 7-4. 동호회 UI
| 작업 | 상태 | 파일 |
|------|------|------|
| 동호회 목록 페이지 | ✅ 완료 | `src/app/(main)/clubs/page.tsx` |
| 동호회 생성 페이지 | ✅ 완료 | `src/app/(main)/clubs/create/page.tsx` |
| 동호회 상세 페이지 | ✅ 완료 | `src/app/(main)/clubs/[id]/page.tsx` |
| 회원 목록 페이지 | ✅ 완료 | `src/app/(main)/clubs/[id]/members/page.tsx` |
| 가입 신청 관리 페이지 | ✅ 완료 | `src/app/(main)/clubs/[id]/requests/page.tsx` |
| 게시판 페이지 | ✅ 완료 | `src/app/(main)/clubs/[id]/posts/page.tsx` |
| Sidebar 메뉴 추가 | ✅ 완료 | `src/components/layout/Sidebar.tsx` |

### 7-5. 실시간 채팅
| 작업 | 상태 | 파일 |
|------|------|------|
| 채팅 API | ✅ 완료 | `src/app/api/clubs/[id]/chat/route.ts` |
| 채팅 UI 컴포넌트 | ✅ 완료 | `src/components/clubs/ClubChat.tsx` |
| 채팅 페이지 | ✅ 완료 | `src/app/(main)/clubs/[id]/chat/page.tsx` |
| Supabase Realtime 구독 | ✅ 완료 | WebSocket 실시간 메시지 |

### 7-6. 투표 기능
| 작업 | 상태 | 파일 |
|------|------|------|
| 투표 참여 API | ✅ 완료 | `src/app/api/clubs/[id]/posts/[postId]/vote/route.ts` |
| PollCard 컴포넌트 | ✅ 완료 | `src/components/clubs/PollCard.tsx` |
| 게시물 작성 (투표 포함) | ✅ 완료 | `src/app/(main)/clubs/[id]/posts/new/page.tsx` |
| 게시물 상세 (투표 표시) | ✅ 완료 | `src/app/(main)/clubs/[id]/posts/[postId]/page.tsx` |

### 7-7. 갤러리 기능
| 작업 | 상태 | 파일 |
|------|------|------|
| club-images Storage 버킷 | ✅ 완료 | Supabase MCP |
| 이미지 업로드 API | ✅ 완료 | `src/app/api/clubs/[id]/images/route.ts` |
| ImageUploader 컴포넌트 | ✅ 완료 | `src/components/clubs/ImageUploader.tsx` |
| 갤러리 페이지 | ✅ 완료 | `src/app/(main)/clubs/[id]/gallery/page.tsx` |

### 7-8. 동호회 추천 알고리즘
| 작업 | 상태 | 파일 |
|------|------|------|
| 5요소 추천 알고리즘 | ✅ 완료 | `src/lib/clubs/recommendationAlgorithm.ts` |
| 추천 API | ✅ 완료 | `src/app/api/clubs/recommendations/route.ts` |
| ClubRecommendations 컴포넌트 | ✅ 완료 | `src/components/clubs/ClubRecommendations.tsx` |
| 동호회 목록 추천 통합 | ✅ 완료 | `src/app/(main)/clubs/page.tsx` |

### 7-9. LLM 통합 (Anthropic)
| 작업 | 상태 | 파일 |
|------|------|------|
| Anthropic 클라이언트 | ✅ 완료 | `src/lib/anthropic/client.ts` |
| 동호회 설명 생성 API | ✅ 완료 | `src/app/api/clubs/[id]/generate-description/route.ts` |
| 활동 요약 API | ✅ 완료 | `src/app/api/clubs/[id]/activity-summary/route.ts` |
| 추천 이유 설명 API | ✅ 완료 | `src/app/api/clubs/recommendations/explain/route.ts` |

> **참고**: LLM 기능 사용을 위해 `ANTHROPIC_API_KEY` 환경변수 설정 필요

---

## Phase 8: 의미 검색 기능 구현
**상태: 완료**

### 8-1. 쿼리 확장 모듈
| 작업 | 상태 | 파일 |
|------|------|------|
| Claude 쿼리 확장 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |
| MBTI/태그 추천 로직 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |
| 폴백 처리 | ✅ 완료 | `src/lib/anthropic/queryExpansion.ts` |

### 8-2. 하이브리드 검색 모듈
| 작업 | 상태 | 파일 |
|------|------|------|
| 벡터 유사도 검색 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| MBTI 매칭 점수 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| 태그 매칭 점수 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |
| 매칭 이유 생성 | ✅ 완료 | `src/lib/matching/semanticMatcher.ts` |

### 8-3. 의미 검색 API
| 작업 | 상태 | 파일 |
|------|------|------|
| POST /api/graph/semantic-search | ✅ 완료 | `src/app/api/graph/semantic-search/route.ts` |
| 쿼리 임베딩 생성 | ✅ 완료 | `src/app/api/graph/semantic-search/route.ts` |
| 그래프 노드 변환 | ✅ 완료 | `src/app/api/graph/semantic-search/route.ts` |

### 8-4. UI 컴포넌트
| 작업 | 상태 | 파일 |
|------|------|------|
| SemanticSearch 컴포넌트 | ✅ 완료 | `src/components/graph/SemanticSearch.tsx` |
| 예시 쿼리 표시 | ✅ 완료 | `src/components/graph/SemanticSearch.tsx` |
| AI 분석 결과 표시 | ✅ 완료 | `src/components/graph/SemanticSearch.tsx` |
| 유사도 필터 슬라이더 | ✅ 완료 | `src/components/graph/SemanticSearch.tsx` |

### 8-5. 네트워크 페이지 통합
| 작업 | 상태 | 파일 |
|------|------|------|
| 탭 네비게이션 (키워드/의미검색) | ✅ 완료 | `src/app/(main)/network/page.tsx` |
| 의미 검색 결과 그래프 표시 | ✅ 완료 | `src/app/(main)/network/page.tsx` |

### 점수 가중치
| 요소 | 가중치 |
|------|--------|
| 벡터 유사도 | 50% |
| MBTI 매칭 | 25% |
| 태그 매칭 | 15% |
| 텍스트 매칭 | 10% |

> **참고**: 의미 검색은 Claude + OpenAI 임베딩을 조합한 하이브리드 방식

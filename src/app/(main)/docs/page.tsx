import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/docs/MermaidDiagram";
import {
  Network,
  Search,
  UserCircle,
  MessageSquare,
  Calendar,
  Bell,
  Settings,
  Shield,
  Database,
  Cpu,
  Globe,
  Layers,
  ScanFace,
} from "lucide-react";

export const metadata: Metadata = {
  title: "시스템 문서 | sureNet",
  description: "sureNet 시스템 아키텍처 및 기술 문서",
};

// Mermaid 다이어그램 정의
const DIAGRAMS = {
  systemArchitecture: `flowchart TB
    subgraph Client["🖥️ 클라이언트"]
        direction TB
        Browser["React 19 + TypeScript<br/>Tailwind CSS v4 + shadcn/ui"]
        ReactFlow["@xyflow/react<br/>+ d3-force 레이아웃"]
        MediaPipe["MediaPipe Face Detector<br/>브라우저 내 실시간 감지"]
    end

    subgraph NextJS["⚡ Next.js 16 (App Router)"]
        direction TB
        Pages["Server Components<br/>+ Client Components"]
        API["API Routes<br/>RESTful 엔드포인트"]
        MW["Middleware<br/>인증/라우팅 가드"]
    end

    subgraph AI["🤖 AI 서비스"]
        direction TB
        OpenAI["OpenAI API<br/>text-embedding-3-small<br/>1536차원 벡터"]
        Claude["Anthropic Claude<br/>claude-sonnet-4-5-20250929<br/>쿼리 확장/분석"]
        FaceAPI["FastAPI + face_recognition<br/>dlib 기반 얼굴 임베딩<br/>128차원 벡터"]
    end

    subgraph Supabase["🗄️ Supabase"]
        direction TB
        Auth["Supabase Auth<br/>JWT + RLS"]
        DB["PostgreSQL 15<br/>+ pgvector 확장<br/>벡터 유사도 검색"]
        Storage["Supabase Storage<br/>프로필 이미지/아바타"]
        Realtime["Realtime<br/>실시간 구독"]
    end

    subgraph Deploy["🚀 배포"]
        Railway["Railway<br/>Docker 컨테이너"]
    end

    Browser --> Pages
    ReactFlow --> API
    MediaPipe --> API
    Pages --> MW
    MW --> Auth
    API --> OpenAI
    API --> Claude
    API --> FaceAPI
    API --> DB
    API --> Realtime
    Pages --> Storage
    NextJS --> Deploy`,

  semanticSearchFlow: `sequenceDiagram
    actor U as 사용자
    participant FE as 프론트엔드
    participant API as API
    participant AI as Claude
    participant EMB as OpenAI
    participant DB as Supabase

    U->>FE: 자연어 검색 입력
    FE->>API: POST /api/graph/semantic-search
    API->>API: analyzeQuery() 전략 결정
    API->>AI: 쿼리 확장 요청
    AI-->>API: ExpandedQuery 반환
    API->>EMB: 임베딩 생성 요청
    EMB-->>API: 1536차원 벡터
    API->>DB: 프로필 + 임베딩 조회
    DB-->>API: 후보 목록
    API->>API: performSemanticSearch()
    Note over API: 하이브리드 매칭<br/>벡터 + 텍스트 + MBTI + 태그
    API-->>FE: 정렬된 검색 결과
    FE-->>U: 네트워크 시각화`,

  matchingScores: `pie showData
    title 하이브리드 매칭 점수 구성
    "벡터 유사도" : 25
    "프로필 필드" : 30
    "텍스트 매칭" : 25
    "MBTI 호환성" : 10
    "태그 오버랩" : 10`,

  databaseERD: `erDiagram
    users ||--o| profiles : has
    users ||--o{ conversations : participates
    users ||--o{ board_posts : writes
    users ||--o{ notifications : receives
    users ||--o| fr_identities : has

    profiles ||--o{ profile_tags : has
    profiles ||--o| embeddings : has
    profiles }o--|| cohorts : belongs_to

    conversations ||--o{ messages : contains
    conversations ||--o{ conversation_participants : has

    board_posts ||--o{ board_comments : has
    board_posts }o--|| board_categories : belongs_to

    cohorts ||--o{ announcements : has
    cohorts ||--o{ calendar_events : has`,

  onboardingFlow: `flowchart LR
    Start([시작]) --> Step1[조직 정보]
    Step1 --> Step2[기본 정보]
    Step2 --> Step3[자기 소개]
    Step3 --> Step4[관심사/태그]
    Step4 --> Step5[협업 스타일]
    Step5 --> Step6[공개 범위]
    Step6 --> Step7[프로필 사진]
    Step7 --> Complete([완료])

    style Start fill:#22c55e
    style Complete fill:#22c55e`,

  faceRecognitionFlow: `sequenceDiagram
    actor U as 사용자
    participant MP as MediaPipe
    participant FE as 프론트엔드
    participant API as Next.js API
    participant FR as FastAPI
    participant DB as Supabase

    U->>FE: 카메라 활성화
    FE->>MP: 얼굴 감지 시작
    loop 매 프레임
        MP->>FE: 얼굴 바운딩 박스
    end
    FE->>API: POST /api/face-recognition/recognize
    API->>FR: 얼굴 임베딩 + 매칭
    FR->>DB: fr_identities 조회
    DB-->>FR: 매칭 결과
    FR-->>API: 인식 결과 (user_id, profile)
    API-->>FE: RecognitionResult
    FE-->>U: 프로필 페이지로 이동`,

  developmentTimeline: `gantt
    title 프로젝트 개발 일정 (3주)
    dateFormat YYYY-MM-DD

    section 📋 기획
    주제 선정           :done, planning1, 2024-12-10, 2d
    요구사항 분석       :done, planning2, after planning1, 2d
    아키텍처 설계       :done, planning3, after planning2, 2d

    section 💻 개발
    DB 스키마 설계      :done, dev1, 2024-12-16, 1d
    인증/프로필 구현    :done, dev2, after dev1, 2d
    네트워크 시각화     :done, dev3, after dev2, 2d
    의미 검색 구현      :done, dev4, after dev3, 2d
    얼굴 인식 통합      :done, dev5, after dev4, 2d

    section 🧪 테스트
    테스트 및 버그 수정 :done, test1, 2024-12-22, 2d

    section 🎬 발표 준비
    시연 영상 제작      :done, prep1, 2024-12-24, 2d
    발표 자료 준비      :done, prep2, 2024-12-25, 1d`,
};

// 기술 스택 데이터
const TECH_STACK = [
  { category: "프레임워크", tech: "Next.js 15", purpose: "풀스택 React 프레임워크", icon: Globe },
  { category: "언어", tech: "TypeScript", purpose: "타입 안전성 보장", icon: Layers },
  { category: "스타일링", tech: "Tailwind CSS v4 + shadcn/ui", purpose: "UI 컴포넌트", icon: Layers },
  { category: "시각화", tech: "React Flow", purpose: "네트워크 그래프 렌더링", icon: Network },
  { category: "데이터베이스", tech: "Supabase PostgreSQL", purpose: "데이터 저장 + RLS", icon: Database },
  { category: "벡터 DB", tech: "pgvector", purpose: "임베딩 유사도 검색", icon: Database },
  { category: "AI 임베딩", tech: "OpenAI text-embedding-3-small", purpose: "1536차원 의미 벡터", icon: Cpu },
  { category: "AI 자연어", tech: "Claude claude-sonnet-4-5-20250929", purpose: "쿼리 확장/분석", icon: Cpu },
  { category: "얼굴 감지", tech: "MediaPipe Face Detector", purpose: "브라우저 내 실시간 얼굴 감지", icon: ScanFace },
  { category: "얼굴 인식", tech: "FastAPI + face_recognition", purpose: "얼굴 임베딩 및 매칭 서버", icon: ScanFace },
  { category: "인증", tech: "Supabase Auth", purpose: "이메일/소셜 로그인", icon: Shield },
  { category: "파일 저장", tech: "Supabase Storage", purpose: "프로필 이미지", icon: Database },
  { category: "배포", tech: "Railway", purpose: "서버 호스팅", icon: Globe },
];

// 주요 기능 모듈
const FEATURE_MODULES = [
  {
    title: "네트워크 시각화",
    description: "방사형/클러스터 레이아웃으로 동료 관계 시각화",
    icon: Network,
    features: ["React Flow 기반", "드래그/줌 지원", "노드 클릭 상세보기", "검색 결과 하이라이트"],
  },
  {
    title: "의미 검색",
    description: "자연어로 원하는 동료 찾기",
    icon: Search,
    features: ["하이브리드 매칭", "자동 전략 결정", "한국어 동의어 확장", "15+ 프로필 필드 검색"],
  },
  {
    title: "프로필 관리",
    description: "상세 프로필 및 공개 범위 설정",
    icon: UserCircle,
    features: ["조직 구조 입력", "MBTI/관심사", "기술 스택", "필드별 공개 범위"],
  },
  {
    title: "메시징",
    description: "1:1 및 그룹 대화",
    icon: MessageSquare,
    features: ["실시간 메시지", "대화 목록", "읽음 표시", "알림 연동"],
  },
  {
    title: "커뮤니티",
    description: "게시판 및 공지사항",
    icon: Bell,
    features: ["카테고리별 게시판", "댓글/좋아요", "공지사항", "검색 기능"],
  },
  {
    title: "캘린더",
    description: "일정 공유 및 관리",
    icon: Calendar,
    features: ["월/주/일 뷰", "이벤트 CRUD", "필터링", "기수별 분리"],
  },
  {
    title: "얼굴 인식 (슈아유?)",
    description: "카메라로 동료를 인식하고 프로필 바로 확인",
    icon: ScanFace,
    features: ["MediaPipe 실시간 감지", "1초마다 자동 인식", "얼굴 등록 관리", "WebRTC 라이브 스트림"],
  },
];

// API 라우트 개요
const API_ROUTES = [
  { category: "인증", count: 3, routes: ["/api/auth/callback", "/api/auth/sign-out", "/api/auth/user"] },
  { category: "프로필", count: 5, routes: ["/api/profile", "/api/profile/avatar", "/api/profile/embedding", "/api/profile/generate-embedding", "/api/profile/visibility"] },
  { category: "네트워크", count: 2, routes: ["/api/graph/data", "/api/graph/semantic-search"] },
  { category: "얼굴 인식", count: 4, routes: ["/api/face-recognition/recognize", "/api/face-recognition/upload-face", "/api/face-recognition/embeddings/status", "/api/face-recognition/embeddings/delete"] },
  { category: "게시판", count: 5, routes: ["/api/board/posts", "/api/board/posts/[id]", "/api/board/posts/[id]/comments", "/api/board/posts/[id]/like", "/api/board/categories"] },
  { category: "공지", count: 3, routes: ["/api/announcements", "/api/announcements/[id]", "/api/announcements/[id]/read"] },
  { category: "메시지", count: 3, routes: ["/api/messages/conversations", "/api/messages/conversations/[id]", "/api/messages/conversations/[id]/messages"] },
  { category: "캘린더", count: 2, routes: ["/api/calendar/events", "/api/calendar/events/[id]"] },
  { category: "관리자", count: 8, routes: ["/api/admin/users", "/api/admin/cohorts", "/api/admin/invitations", "..."] },
];

export default function DocsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      {/* 헤더 */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">sureNet 시스템 문서</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AI 기반 사내 네트워킹 서비스의 아키텍처와 기술 스택
        </p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="secondary">Next.js 15</Badge>
          <Badge variant="secondary">Supabase</Badge>
          <Badge variant="secondary">OpenAI</Badge>
          <Badge variant="secondary">Claude</Badge>
          <Badge variant="secondary">React Flow</Badge>
          <Badge variant="secondary">MediaPipe</Badge>
          <Badge variant="secondary">FastAPI</Badge>
        </div>
      </section>

      {/* 시스템 개요 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">시스템 개요</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                네트워크 시각화
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                동료 관계를 그래프로 시각화하여 조직 내 연결 관계를 직관적으로 파악
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                의미 검색
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                자연어로 "개발 좋아하는 사람" 같은 검색어로 관련 동료 찾기
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                AI 매칭
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                벡터 유사도 + 텍스트 매칭 + MBTI 호환성을 결합한 하이브리드 검색
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ScanFace className="h-5 w-5 text-primary" />
                얼굴 인식 (슈아유?)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                실시간 얼굴 감지 및 인식으로 동료를 즉시 찾기
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 아키텍처 다이어그램 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">아키텍처 다이어그램</h2>

        <div className="space-y-8">
          <MermaidDiagram
            title="전체 시스템 구조"
            chart={DIAGRAMS.systemArchitecture}
          />

          <MermaidDiagram
            title="의미 검색 흐름"
            chart={DIAGRAMS.semanticSearchFlow}
          />

          <MermaidDiagram
            title="얼굴 인식 흐름"
            chart={DIAGRAMS.faceRecognitionFlow}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <MermaidDiagram
              title="매칭 점수 구성"
              chart={DIAGRAMS.matchingScores}
            />
            <MermaidDiagram
              title="온보딩 흐름"
              chart={DIAGRAMS.onboardingFlow}
            />
          </div>

          <MermaidDiagram
            title="데이터베이스 ERD"
            chart={DIAGRAMS.databaseERD}
          />
        </div>
      </section>

      {/* 개발 일정 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">개발 일정</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              프로젝트 타임라인 (2024.12.10 ~ 12.26)
            </CardTitle>
            <CardDescription>
              총 3주간의 집중 개발 기간 동안 기획부터 발표까지 전 과정을 수행했습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MermaidDiagram
              chart={DIAGRAMS.developmentTimeline}
            />
          </CardContent>
        </Card>
      </section>

      {/* 기술 스택 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">기술 스택</h2>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">분류</TableHead>
                  <TableHead>기술</TableHead>
                  <TableHead>용도</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TECH_STACK.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                        {item.tech}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.purpose}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* 주요 기능 모듈 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">주요 기능 모듈</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_MODULES.map((module, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <module.icon className="h-5 w-5 text-primary" />
                  {module.title}
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {module.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* API 라우트 개요 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">API 라우트 개요</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {API_ROUTES.map((group, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {group.category}
                  <Badge variant="secondary">{group.count}개</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs space-y-1 font-mono">
                  {group.routes.slice(0, 3).map((route, i) => (
                    <li key={i} className="text-muted-foreground truncate">
                      {route}
                    </li>
                  ))}
                  {group.routes.length > 3 && (
                    <li className="text-muted-foreground">...</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 검색 전략 상세 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">검색 전략 상세</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              자동 전략 결정 시스템
            </CardTitle>
            <CardDescription>
              쿼리 특성에 따라 최적의 검색 전략을 자동으로 선택합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>전략</TableHead>
                  <TableHead>조건</TableHead>
                  <TableHead>벡터</TableHead>
                  <TableHead>텍스트</TableHead>
                  <TableHead>프로필</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <Badge variant="outline">text_heavy</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    짧은 쿼리, 특정 키워드
                  </TableCell>
                  <TableCell>15%</TableCell>
                  <TableCell className="text-primary font-medium">40%</TableCell>
                  <TableCell>25%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Badge variant="outline">balanced</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    중간 길이, 혼합 쿼리
                  </TableCell>
                  <TableCell>25%</TableCell>
                  <TableCell>25%</TableCell>
                  <TableCell>30%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Badge variant="outline">vector_heavy</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    긴 문장, 설명적 쿼리
                  </TableCell>
                  <TableCell className="text-primary font-medium">40%</TableCell>
                  <TableCell>10%</TableCell>
                  <TableCell>30%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* 푸터 */}
      <footer className="text-center text-sm text-muted-foreground pt-8 border-t">
        <p>sureNet - AI 기반 사내 네트워킹 서비스</p>
        <p className="mt-1">Built with Next.js, Supabase, OpenAI, Claude, MediaPipe, and FastAPI</p>
      </footer>
    </div>
  );
}

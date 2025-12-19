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
} from "lucide-react";

export const metadata: Metadata = {
  title: "시스템 문서 | sureNet",
  description: "sureNet 시스템 아키텍처 및 기술 문서",
};

// Mermaid 다이어그램 정의
const DIAGRAMS = {
  systemArchitecture: `flowchart TB
    subgraph Client["클라이언트"]
        Browser["웹 브라우저"]
        ReactFlow["React Flow<br/>네트워크 시각화"]
    end

    subgraph NextJS["Next.js 15"]
        Pages["페이지 (SSR)"]
        API["API Routes"]
        MW["미들웨어<br/>인증/라우팅"]
    end

    subgraph AI["AI 서비스"]
        OpenAI["OpenAI<br/>text-embedding-3-small"]
        Claude["Claude<br/>claude-sonnet-4-5-20250929"]
    end

    subgraph Supabase["Supabase"]
        Auth["인증<br/>Auth"]
        DB["PostgreSQL<br/>+ pgvector"]
        Storage["파일 스토리지"]
    end

    Browser --> Pages
    ReactFlow --> API
    MW --> Auth
    API --> OpenAI
    API --> Claude
    API --> DB
    Pages --> Storage`,

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
];

// API 라우트 개요
const API_ROUTES = [
  { category: "인증", count: 3, routes: ["/api/auth/callback", "/api/auth/sign-out", "/api/auth/user"] },
  { category: "프로필", count: 5, routes: ["/api/profile", "/api/profile/avatar", "/api/profile/embedding", "/api/profile/generate-embedding", "/api/profile/visibility"] },
  { category: "네트워크", count: 2, routes: ["/api/graph/data", "/api/graph/semantic-search"] },
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
        </div>
      </section>

      {/* 시스템 개요 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">시스템 개요</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <p className="mt-1">Built with Next.js, Supabase, OpenAI, and Claude</p>
      </footer>
    </div>
  );
}

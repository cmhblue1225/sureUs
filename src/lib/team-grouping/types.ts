/**
 * Team Grouping Types
 *
 * 조 편성 기능에 사용되는 타입 정의
 */

// 그룹핑 기준 - Claude AI가 자연어를 파싱한 결과
export interface GroupingCriteria {
  diverseDepartments: boolean;   // 부서 다양하게 섞기
  similarDepartments: boolean;   // 같은 부서끼리 묶기
  similarMbti: boolean;          // MBTI 궁합 좋게/비슷하게
  diverseMbti: boolean;          // MBTI 다양하게
  sameLocation: boolean;         // 같은 지역끼리
  mixedLocations: boolean;       // 지역 다양하게
  mixedJobLevels: boolean;       // 직급 다양하게 (멘토-멘티)
  sameJobLevels: boolean;        // 같은 직급끼리
  customRules: string[];         // 추가 규칙 (자연어)
  confidence: number;            // AI 파싱 신뢰도 (0-1)
}

// 기본 그룹핑 기준
export const DEFAULT_GROUPING_CRITERIA: GroupingCriteria = {
  diverseDepartments: false,
  similarDepartments: false,
  similarMbti: false,
  diverseMbti: false,
  sameLocation: false,
  mixedLocations: false,
  mixedJobLevels: false,
  sameJobLevels: false,
  customRules: [],
  confidence: 0,
};

// 팀 멤버 정보
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];
}

// 생성된 팀
export interface GeneratedTeam {
  teamIndex: number;              // 1부터 시작하는 팀 번호
  teamName: string;               // "1조", "2조" 등
  members: TeamMember[];          // 팀 멤버 목록
  diversity: {
    departmentCount: number;      // 서로 다른 부서 수
    mbtiCount: number;            // 서로 다른 MBTI 수
    locationCount: number;        // 서로 다른 지역 수
  };
  averageSimilarity?: number;     // 팀 내 평균 유사도 (선택)
  reasoning?: string;             // AI가 생성한 팀 구성 이유
}

// 조 편성 결과
export interface TeamGroupingResult {
  id?: string;                    // DB 저장 후 ID
  cohortId: string;
  criteriaText: string;           // 원본 자연어 입력
  criteriaParsed: GroupingCriteria;
  teamSize: number;               // 팀당 인원 수
  teamCount: number;              // 생성된 팀 수
  teams: GeneratedTeam[];         // 팀 목록
  ungroupedMembers: TeamMember[]; // 미배정 멤버 (나머지)
  createdBy: string;
  createdAt?: string;
  sharedVia?: 'announcement' | 'messages' | null;
  sharedAt?: string;
}

// 조 편성 이력 (목록용)
export interface TeamGroupingHistoryItem {
  id: string;
  criteriaText: string;
  teamCount: number;
  teamSize: number;
  createdAt: string;
  sharedVia: 'announcement' | 'messages' | null;
}

// API 요청/응답 타입

export interface GenerateTeamsRequest {
  criteriaText: string;
  teamSize: number;
}

export interface GenerateTeamsResponse {
  success: boolean;
  data?: TeamGroupingResult;
  error?: string;
}

export interface ShareRequest {
  groupingId: string;
  shareType: 'announcement' | 'messages';
  announcementTitle?: string;
  messageTemplate?: string;
}

export interface ShareResponse {
  success: boolean;
  data?: {
    sharedVia: 'announcement' | 'messages';
    announcementId?: string;
    messageCount?: number;
  };
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: TeamGroupingHistoryItem[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

// 기준별 점수 가중치
export interface CriteriaWeights {
  department: number;
  mbti: number;
  location: number;
  jobLevel: number;
}

export const DEFAULT_CRITERIA_WEIGHTS: CriteriaWeights = {
  department: 0.3,
  mbti: 0.3,
  location: 0.2,
  jobLevel: 0.2,
};

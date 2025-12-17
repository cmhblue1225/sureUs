/**
 * 온보딩 타입 정의
 */

// 온보딩 단계 (0-7)
// 0: Intro (서비스 소개), 1-6: 정보 입력, 7: Complete
export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// 온보딩 상태 인터페이스
export interface OnboardingState {
  currentStep: OnboardingStep;

  // Step 1: 기본 정보 (필수) - 새로운 조직 구조
  orgLevel1: string;       // 연구소/센터/본부 (필수)
  orgLevel2: string;       // 실 (선택)
  orgLevel3: string;       // 팀 (선택)
  jobPosition: string;     // 직급 (필수)
  officeLocation: string;  // 근무지 (필수)

  // Legacy 필드 (하위 호환성)
  department: string;      // 자동 계산됨
  jobRole: string;         // deprecated

  // Step 2: MBTI
  mbti: string;

  // Step 3: 개인 정보
  ageRange: string;
  livingLocation: string;
  hometown: string;
  education: string;

  // Step 4: 업무 정보
  workDescription: string;
  techStack: string;
  certifications: string;
  languages: string;

  // Step 5: 취미/관심사
  hobbies: Set<string>;
  interests: string;
  favoriteFood: string;

  // Step 6: 자기소개
  collaborationStyle: string;
  strengths: string;
  preferredPeopleType: string;
  careerGoals: string;
}

// 온보딩 상태 초기값
export const initialOnboardingState: OnboardingState = {
  currentStep: 0,

  // Step 1 - 새로운 조직 구조
  orgLevel1: "",
  orgLevel2: "",
  orgLevel3: "",
  jobPosition: "",
  officeLocation: "",

  // Legacy 필드
  department: "",
  jobRole: "",

  // Step 2
  mbti: "",

  // Step 3
  ageRange: "",
  livingLocation: "",
  hometown: "",
  education: "",

  // Step 4
  workDescription: "",
  techStack: "",
  certifications: "",
  languages: "",

  // Step 5
  hobbies: new Set<string>(),
  interests: "",
  favoriteFood: "",

  // Step 6
  collaborationStyle: "",
  strengths: "",
  preferredPeopleType: "",
  careerGoals: "",
};

// MBTI 타입 목록
export const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

// MBTI 설명
export const MBTI_DESCRIPTIONS: Record<MbtiType, string> = {
  INTJ: "전략가",
  INTP: "논리술사",
  ENTJ: "통솔자",
  ENTP: "변론가",
  INFJ: "옹호자",
  INFP: "중재자",
  ENFJ: "선도자",
  ENFP: "활동가",
  ISTJ: "현실주의자",
  ISFJ: "수호자",
  ESTJ: "경영자",
  ESFJ: "집정관",
  ISTP: "장인",
  ISFP: "모험가",
  ESTP: "사업가",
  ESFP: "연예인",
};

// 기본 취미 태그 목록
export const DEFAULT_HOBBY_TAGS = [
  "운동",
  "독서",
  "영화/드라마",
  "음악",
  "게임",
  "여행",
  "요리",
  "사진",
  "캠핑",
  "등산",
  "수영",
  "헬스",
  "러닝",
  "자전거",
  "골프",
  "테니스",
  "축구",
  "농구",
  "배드민턴",
  "볼링",
  "당구",
  "보드게임",
  "카페",
  "맛집탐방",
  "와인",
  "커피",
  "베이킹",
  "그림",
  "악기연주",
  "노래",
  "댄스",
  "요가",
  "필라테스",
  "명상",
  "반려동물",
  "식물",
  "인테리어",
  "패션",
  "뷰티",
  "IT/테크",
  "재테크",
  "자기계발",
  "봉사활동",
  "외국어",
] as const;

// 단계별 정보
export interface StepInfo {
  title: string;
  description: string;
  icon: string;
  required: boolean;
}

export const STEP_INFO: Record<OnboardingStep, StepInfo> = {
  0: {
    title: "sureUs 소개",
    description: "관계를 이해하는 새로운 방식",
    icon: "✨",
    required: false,
  },
  1: {
    title: "기본 정보",
    description: "회사에서의 기본 정보를 알려주세요",
    icon: "📋",
    required: true,
  },
  2: {
    title: "성격 & MBTI",
    description: "당신의 MBTI를 선택해주세요",
    icon: "🧠",
    required: false,
  },
  3: {
    title: "개인 정보",
    description: "조금 더 자세한 정보를 알려주세요",
    icon: "👤",
    required: false,
  },
  4: {
    title: "업무 정보",
    description: "업무에 대해 알려주세요",
    icon: "💼",
    required: false,
  },
  5: {
    title: "취미 & 관심사",
    description: "취미와 관심사를 공유해주세요",
    icon: "🎯",
    required: false,
  },
  6: {
    title: "자기 소개",
    description: "나를 표현해보세요",
    icon: "✍️",
    required: false,
  },
  7: {
    title: "완료!",
    description: "프로필이 생성되었습니다",
    icon: "🎊",
    required: false,
  },
};

// 총 단계 수 (Welcome 제외, Complete 제외 = 6단계)
export const TOTAL_PROGRESS_STEPS = 6;

// Step props 공통 타입
export interface StepProps {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip?: () => void;
}

// 초기 프로필 데이터 (관리자가 생성한 계정의 기존 정보)
export interface InitialProfileData {
  org_level1?: string | null;
  org_level2?: string | null;
  org_level3?: string | null;
  job_position?: string | null;
  office_location?: string | null;
  department?: string | null;
  mbti?: string | null;
  age_range?: string | null;
  living_location?: string | null;
  hometown?: string | null;
  education?: string | null;
  work_description?: string | null;
  tech_stack?: string | null;
  certifications?: string | null;
  languages?: string | null;
  interests?: string | null;
  favorite_food?: string | null;
  collaboration_style?: string | null;
  strengths?: string | null;
  preferred_people_type?: string | null;
  career_goals?: string | null;
}

// InitialProfileData를 OnboardingState로 변환하는 헬퍼 함수
export function createInitialStateFromProfile(
  profile: InitialProfileData | null
): OnboardingState {
  if (!profile) {
    return initialOnboardingState;
  }

  return {
    ...initialOnboardingState,
    orgLevel1: profile.org_level1 || "",
    orgLevel2: profile.org_level2 || "",
    orgLevel3: profile.org_level3 || "",
    jobPosition: profile.job_position || "",
    officeLocation: profile.office_location || "",
    department: profile.department || "",
    mbti: profile.mbti || "",
    ageRange: profile.age_range || "",
    livingLocation: profile.living_location || "",
    hometown: profile.hometown || "",
    education: profile.education || "",
    workDescription: profile.work_description || "",
    techStack: profile.tech_stack || "",
    certifications: profile.certifications || "",
    languages: profile.languages || "",
    interests: profile.interests || "",
    favoriteFood: profile.favorite_food || "",
    collaborationStyle: profile.collaboration_style || "",
    strengths: profile.strengths || "",
    preferredPeopleType: profile.preferred_people_type || "",
    careerGoals: profile.career_goals || "",
    hobbies: new Set<string>(),
  };
}

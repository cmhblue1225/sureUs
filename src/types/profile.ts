import type { VisibilitySettings } from "./database";

export interface ProfileFormData {
  // 조직 정보 (새로운 계층 구조)
  orgLevel1: string;       // 연구소/센터/본부 (필수)
  orgLevel2?: string;      // 실 (선택)
  orgLevel3?: string;      // 팀 (선택)
  jobPosition: string;     // 직급 (필수)
  officeLocation: string;  // 근무지 (필수)

  // Legacy 필드 (하위 호환성 - 자동 계산됨)
  department?: string;     // orgLevel1 > orgLevel2 > orgLevel3 경로
  jobRole?: string;        // deprecated, 이전 데이터 호환용

  mbti?: string;
  hobbies: string[];
  collaborationStyle?: string;
  strengths?: string;
  preferredPeopleType?: string;
  // 새 필드
  livingLocation?: string;
  hometown?: string;
  education?: string;
  workDescription?: string;
  techStack?: string;
  favoriteFood?: string;
  ageRange?: string;
  interests?: string;
  careerGoals?: string;
  certifications?: string;
  languages?: string;
  // 설정
  visibilitySettings: VisibilitySettings;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;

  // 조직 정보 (새로운 계층 구조)
  orgLevel1: string;       // 연구소/센터/본부
  orgLevel2?: string;      // 실
  orgLevel3?: string;      // 팀
  jobPosition: string;     // 직급
  officeLocation: string;  // 근무지

  // Legacy 필드 (하위 호환성)
  department: string;      // 계산된 전체 경로
  jobRole?: string;        // deprecated

  mbti?: string;
  hobbies: string[];
  collaborationStyle?: string;
  strengths?: string;
  preferredPeopleType?: string;
  // 새 필드
  livingLocation?: string;
  hometown?: string;
  education?: string;
  workDescription?: string;
  techStack?: string;
  favoriteFood?: string;
  ageRange?: string;
  interests?: string;
  careerGoals?: string;
  certifications?: string;
  languages?: string;
  // 역할
  role: "admin" | "user";
  // 시스템 필드
  visibilitySettings: VisibilitySettings;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  // 새로운 조직 기반 선호도
  preferredOrgLevel1?: string[];     // 선호 연구소/센터
  preferredJobPositions?: string[];  // 선호 직급

  // Legacy 필드 (하위 호환성)
  preferredDepartments?: string[];
  preferredJobRoles?: string[];
  preferredLocations?: string[];

  preferredMbtiTypes?: string[];
  embeddingWeight: number;
  tagWeight: number;
  preferenceWeight: number;
  excludedUserIds?: string[];
}

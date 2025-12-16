import type { VisibilitySettings } from "./database";

export interface ProfileFormData {
  department: string;
  jobRole: string;
  officeLocation: string;
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
  department: string;
  jobRole: string;
  officeLocation: string;
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
  // 시스템 필드
  visibilitySettings: VisibilitySettings;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  preferredDepartments?: string[];
  preferredJobRoles?: string[];
  preferredLocations?: string[];
  preferredMbtiTypes?: string[];
  embeddingWeight: number;
  tagWeight: number;
  preferenceWeight: number;
  excludedUserIds?: string[];
}

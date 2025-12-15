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

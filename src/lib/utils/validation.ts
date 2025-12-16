import { z } from "zod";

const visibilityLevelSchema = z.enum(["public", "department", "private"]);

export const visibilitySettingsSchema = z.object({
  department: visibilityLevelSchema,
  job_role: visibilityLevelSchema,
  office_location: visibilityLevelSchema,
  mbti: visibilityLevelSchema,
  hobbies: visibilityLevelSchema,
  collaboration_style: visibilityLevelSchema,
  strengths: visibilityLevelSchema,
  preferred_people_type: visibilityLevelSchema,
  // 새 필드
  living_location: visibilityLevelSchema,
  hometown: visibilityLevelSchema,
  education: visibilityLevelSchema,
  work_description: visibilityLevelSchema,
  tech_stack: visibilityLevelSchema,
  favorite_food: visibilityLevelSchema,
  age_range: visibilityLevelSchema,
  interests: visibilityLevelSchema,
  career_goals: visibilityLevelSchema,
  certifications: visibilityLevelSchema,
  languages: visibilityLevelSchema,
});

export const profileFormSchema = z.object({
  department: z.string().min(1, "부서를 선택해주세요"),
  jobRole: z.string().min(1, "직군을 선택해주세요"),
  officeLocation: z.string().min(1, "근무지를 선택해주세요"),
  mbti: z.string().optional(),
  hobbies: z.array(z.string()).min(1, "최소 1개의 관심사를 선택해주세요"),
  collaborationStyle: z.string().optional(),
  strengths: z.string().optional(),
  preferredPeopleType: z.string().optional(),
  // 새 필드
  livingLocation: z.string().optional(),
  hometown: z.string().optional(),
  education: z.string().optional(),
  workDescription: z.string().optional(),
  techStack: z.string().optional(),
  favoriteFood: z.string().optional(),
  ageRange: z.string().optional(),
  interests: z.string().optional(),
  careerGoals: z.string().optional(),
  certifications: z.string().optional(),
  languages: z.string().optional(),
  // 설정
  visibilitySettings: visibilitySettingsSchema,
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

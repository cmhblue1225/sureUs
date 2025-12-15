import { z } from "zod";

export const visibilitySettingsSchema = z.object({
  department: z.enum(["public", "department", "private"]),
  job_role: z.enum(["public", "department", "private"]),
  office_location: z.enum(["public", "department", "private"]),
  mbti: z.enum(["public", "department", "private"]),
  hobbies: z.enum(["public", "department", "private"]),
  collaboration_style: z.enum(["public", "department", "private"]),
  strengths: z.enum(["public", "department", "private"]),
  preferred_people_type: z.enum(["public", "department", "private"]),
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
  visibilitySettings: visibilitySettingsSchema,
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

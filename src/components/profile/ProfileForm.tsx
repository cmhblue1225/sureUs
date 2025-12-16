"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "./TagInput";
import { VisibilitySelector } from "./VisibilitySelector";
import { AvatarUpload } from "./AvatarUpload";
import { LLMAssistButton } from "./LLMAssistButton";
import { TagSuggestButton } from "./TagSuggestButton";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { JOB_ROLES } from "@/lib/constants/jobRoles";
import { OFFICE_LOCATIONS } from "@/lib/constants/locations";
import { MBTI_TYPES } from "@/lib/constants/mbtiTypes";
import type { VisibilityLevel, VisibilitySettings } from "@/types/database";
import type { UserProfile } from "@/types/profile";

interface ProfileFormProps {
  initialData?: Partial<UserProfile>;
  currentAvatarUrl?: string | null;
}

export function ProfileForm({ initialData, currentAvatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);

  // Form state - 기본 정보
  const [department, setDepartment] = useState(initialData?.department || "");
  const [jobRole, setJobRole] = useState(initialData?.jobRole || "");
  const [officeLocation, setOfficeLocation] = useState(initialData?.officeLocation || "");
  const [mbti, setMbti] = useState(initialData?.mbti || "");
  const [hobbies, setHobbies] = useState<string[]>(initialData?.hobbies || []);
  const [collaborationStyle, setCollaborationStyle] = useState(initialData?.collaborationStyle || "");
  const [strengths, setStrengths] = useState(initialData?.strengths || "");
  const [preferredPeopleType, setPreferredPeopleType] = useState(initialData?.preferredPeopleType || "");

  // Form state - 새 필드
  const [livingLocation, setLivingLocation] = useState(initialData?.livingLocation || "");
  const [hometown, setHometown] = useState(initialData?.hometown || "");
  const [education, setEducation] = useState(initialData?.education || "");
  const [workDescription, setWorkDescription] = useState(initialData?.workDescription || "");
  const [techStack, setTechStack] = useState(initialData?.techStack || "");
  const [favoriteFood, setFavoriteFood] = useState(initialData?.favoriteFood || "");
  const [ageRange, setAgeRange] = useState(initialData?.ageRange || "");
  const [interests, setInterests] = useState(initialData?.interests || "");
  const [careerGoals, setCareerGoals] = useState(initialData?.careerGoals || "");
  const [certifications, setCertifications] = useState(initialData?.certifications || "");
  const [languages, setLanguages] = useState(initialData?.languages || "");

  // Visibility settings
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(
    initialData?.visibilitySettings || {
      department: "public",
      job_role: "public",
      office_location: "public",
      mbti: "public",
      hobbies: "public",
      collaboration_style: "public",
      strengths: "public",
      preferred_people_type: "public",
      // 새 필드 기본값
      living_location: "public",
      hometown: "public",
      education: "public",
      work_description: "public",
      tech_stack: "public",
      favorite_food: "public",
      age_range: "public",
      interests: "public",
      career_goals: "public",
      certifications: "public",
      languages: "public",
    }
  );

  const updateVisibility = (field: keyof VisibilitySettings, value: VisibilityLevel) => {
    setVisibilitySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          jobRole,
          officeLocation,
          mbti: mbti || undefined,
          hobbies,
          collaborationStyle: collaborationStyle || undefined,
          strengths: strengths || undefined,
          preferredPeopleType: preferredPeopleType || undefined,
          // 새 필드
          livingLocation: livingLocation || undefined,
          hometown: hometown || undefined,
          education: education || undefined,
          workDescription: workDescription || undefined,
          techStack: techStack || undefined,
          favoriteFood: favoriteFood || undefined,
          ageRange: ageRange || undefined,
          interests: interests || undefined,
          careerGoals: careerGoals || undefined,
          certifications: certifications || undefined,
          languages: languages || undefined,
          // 설정
          visibilitySettings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "프로필 저장에 실패했습니다.");
        return;
      }

      router.push("/profile");
      router.refresh();
    } catch {
      setError("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>프로필 사진</CardTitle>
          <CardDescription>나를 나타내는 사진을 등록하세요 (선택)</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <AvatarUpload
            currentAvatarUrl={avatarUrl}
            onUploadSuccess={(url) => setAvatarUrl(url)}
            onRemoveSuccess={() => setAvatarUrl(null)}
            size="lg"
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>필수 정보를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Department */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="department">부서 *</Label>
              <VisibilitySelector
                value={visibilitySettings.department}
                onChange={(v) => updateVisibility("department", v)}
              />
            </div>
            <Select value={department} onValueChange={setDepartment} disabled={loading}>
              <SelectTrigger id="department">
                <SelectValue placeholder="부서를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Role */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jobRole">직군 *</Label>
              <VisibilitySelector
                value={visibilitySettings.job_role}
                onChange={(v) => updateVisibility("job_role", v)}
              />
            </div>
            <Select value={jobRole} onValueChange={setJobRole} disabled={loading}>
              <SelectTrigger id="jobRole">
                <SelectValue placeholder="직군을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {JOB_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Office Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="officeLocation">근무지 *</Label>
              <VisibilitySelector
                value={visibilitySettings.office_location}
                onChange={(v) => updateVisibility("office_location", v)}
              />
            </div>
            <Select value={officeLocation} onValueChange={setOfficeLocation} disabled={loading}>
              <SelectTrigger id="officeLocation">
                <SelectValue placeholder="근무지를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {OFFICE_LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MBTI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mbti">MBTI (선택)</Label>
              <VisibilitySelector
                value={visibilitySettings.mbti}
                onChange={(v) => updateVisibility("mbti", v)}
              />
            </div>
            <Select value={mbti} onValueChange={setMbti} disabled={loading}>
              <SelectTrigger id="mbti">
                <SelectValue placeholder="MBTI를 선택하세요 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {MBTI_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>개인 정보</CardTitle>
          <CardDescription>나에 대해 더 알려주세요 (선택)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Age Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ageRange">연령대</Label>
              <VisibilitySelector
                value={visibilitySettings.age_range}
                onChange={(v) => updateVisibility("age_range", v)}
              />
            </div>
            <Input
              id="ageRange"
              placeholder="예: 20대 후반, 30대 초반"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Living Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="livingLocation">사는 곳</Label>
              <VisibilitySelector
                value={visibilitySettings.living_location}
                onChange={(v) => updateVisibility("living_location", v)}
              />
            </div>
            <Input
              id="livingLocation"
              placeholder="예: 서울 강남구, 경기 성남시"
              value={livingLocation}
              onChange={(e) => setLivingLocation(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Hometown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hometown">고향</Label>
              <VisibilitySelector
                value={visibilitySettings.hometown}
                onChange={(v) => updateVisibility("hometown", v)}
              />
            </div>
            <Input
              id="hometown"
              placeholder="예: 부산, 대구, 서울"
              value={hometown}
              onChange={(e) => setHometown(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Education */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="education">학교</Label>
              <VisibilitySelector
                value={visibilitySettings.education}
                onChange={(v) => updateVisibility("education", v)}
              />
            </div>
            <Input
              id="education"
              placeholder="예: 서울대학교 컴퓨터공학과"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Info */}
      <Card>
        <CardHeader>
          <CardTitle>업무 정보</CardTitle>
          <CardDescription>업무 관련 정보를 입력해주세요 (선택)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="workDescription">부서에서 하는 일</Label>
                <LLMAssistButton
                  fieldType="workDescription"
                  onSuggestion={setWorkDescription}
                  disabled={loading}
                  additionalContext={{ department, jobRole, techStack }}
                />
              </div>
              <VisibilitySelector
                value={visibilitySettings.work_description}
                onChange={(v) => updateVisibility("work_description", v)}
              />
            </div>
            <Textarea
              id="workDescription"
              placeholder="예: 프론트엔드 개발을 담당하고 있으며, React와 Next.js를 주로 사용합니다."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="techStack">기술 스택</Label>
              <VisibilitySelector
                value={visibilitySettings.tech_stack}
                onChange={(v) => updateVisibility("tech_stack", v)}
              />
            </div>
            <Textarea
              id="techStack"
              placeholder="예: React, TypeScript, Next.js, Node.js, Python"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="certifications">자격증</Label>
              <VisibilitySelector
                value={visibilitySettings.certifications}
                onChange={(v) => updateVisibility("certifications", v)}
              />
            </div>
            <Input
              id="certifications"
              placeholder="예: 정보처리기사, AWS Solutions Architect"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="languages">언어 능력</Label>
              <VisibilitySelector
                value={visibilitySettings.languages}
                onChange={(v) => updateVisibility("languages", v)}
              />
            </div>
            <Input
              id="languages"
              placeholder="예: 영어 (비즈니스), 일본어 (초급)"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hobbies/Interests */}
      <Card>
        <CardHeader>
          <CardTitle>취미/관심사</CardTitle>
          <CardDescription>나를 표현하는 태그를 선택하거나 직접 입력해주세요 (최대 10개)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <TagSuggestButton
              existingTags={hobbies}
              maxTags={10}
              onAddTags={(newTags) => setHobbies([...hobbies, ...newTags])}
              disabled={loading}
            />
            <VisibilitySelector
              value={visibilitySettings.hobbies}
              onChange={(v) => updateVisibility("hobbies", v)}
            />
          </div>
          <TagInput
            value={hobbies}
            onChange={setHobbies}
            maxTags={10}
            disabled={loading}
          />

          {/* Interests */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="interests">관심 분야</Label>
              <VisibilitySelector
                value={visibilitySettings.interests}
                onChange={(v) => updateVisibility("interests", v)}
              />
            </div>
            <Textarea
              id="interests"
              placeholder="예: AI/ML, 스타트업, 여행, 요리, 사진"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Favorite Food */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="favoriteFood">좋아하는 음식</Label>
              <VisibilitySelector
                value={visibilitySettings.favorite_food}
                onChange={(v) => updateVisibility("favorite_food", v)}
              />
            </div>
            <Input
              id="favoriteFood"
              placeholder="예: 한식, 이탈리안, 디저트, 커피"
              value={favoriteFood}
              onChange={(e) => setFavoriteFood(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Text Fields */}
      <Card>
        <CardHeader>
          <CardTitle>자기 소개</CardTitle>
          <CardDescription>
            다른 동료들이 나를 더 잘 알 수 있도록 작성해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collaboration Style */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="collaborationStyle">협업 스타일</Label>
                <LLMAssistButton
                  fieldType="collaborationStyle"
                  onSuggestion={setCollaborationStyle}
                  disabled={loading}
                  additionalContext={{ department, jobRole, mbti, workDescription, techStack }}
                />
              </div>
              <VisibilitySelector
                value={visibilitySettings.collaboration_style}
                onChange={(v) => updateVisibility("collaboration_style", v)}
              />
            </div>
            <Textarea
              id="collaborationStyle"
              placeholder="예: 아이디어 브레인스토밍을 좋아하고, 피드백을 적극적으로 주고받는 것을 선호합니다. 비동기 커뮤니케이션도 잘 활용합니다."
              value={collaborationStyle}
              onChange={(e) => setCollaborationStyle(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="strengths">장점/강점</Label>
                <LLMAssistButton
                  fieldType="strengths"
                  onSuggestion={setStrengths}
                  disabled={loading}
                  additionalContext={{ department, jobRole, mbti, workDescription, techStack, collaborationStyle }}
                />
              </div>
              <VisibilitySelector
                value={visibilitySettings.strengths}
                onChange={(v) => updateVisibility("strengths", v)}
              />
            </div>
            <Textarea
              id="strengths"
              placeholder="예: 문제 해결 능력이 뛰어나고, 새로운 기술을 빠르게 습득합니다. 팀원들과의 원활한 소통을 중요시합니다."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Preferred People Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="preferredPeopleType">선호하는 동료 유형</Label>
                <LLMAssistButton
                  fieldType="preferredPeopleType"
                  onSuggestion={setPreferredPeopleType}
                  disabled={loading}
                  additionalContext={{ department, jobRole, mbti, collaborationStyle, strengths }}
                />
              </div>
              <VisibilitySelector
                value={visibilitySettings.preferred_people_type}
                onChange={(v) => updateVisibility("preferred_people_type", v)}
              />
            </div>
            <Textarea
              id="preferredPeopleType"
              placeholder="예: 솔직하게 의견을 나눌 수 있는 분, 새로운 것에 도전하는 것을 두려워하지 않는 분과 함께 일하고 싶습니다."
              value={preferredPeopleType}
              onChange={(e) => setPreferredPeopleType(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Career Goals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="careerGoals">커리어 목표</Label>
                <LLMAssistButton
                  fieldType="careerGoals"
                  onSuggestion={setCareerGoals}
                  disabled={loading}
                  additionalContext={{ department, jobRole, workDescription, techStack, strengths }}
                />
              </div>
              <VisibilitySelector
                value={visibilitySettings.career_goals}
                onChange={(v) => updateVisibility("career_goals", v)}
              />
            </div>
            <Textarea
              id="careerGoals"
              placeholder="예: 향후 프로덕트 매니저로 성장하고 싶습니다. 기술적 역량과 비즈니스 이해력을 균형있게 갖추고 싶습니다."
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : "프로필 저장"}
        </Button>
      </div>
    </form>
  );
}

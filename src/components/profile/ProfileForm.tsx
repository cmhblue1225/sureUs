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

  // Form state
  const [department, setDepartment] = useState(initialData?.department || "");
  const [jobRole, setJobRole] = useState(initialData?.jobRole || "");
  const [officeLocation, setOfficeLocation] = useState(initialData?.officeLocation || "");
  const [mbti, setMbti] = useState(initialData?.mbti || "");
  const [hobbies, setHobbies] = useState<string[]>(initialData?.hobbies || []);
  const [collaborationStyle, setCollaborationStyle] = useState(initialData?.collaborationStyle || "");
  const [strengths, setStrengths] = useState(initialData?.strengths || "");
  const [preferredPeopleType, setPreferredPeopleType] = useState(initialData?.preferredPeopleType || "");

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

      {/* Hobbies/Interests */}
      <Card>
        <CardHeader>
          <CardTitle>취미/관심사</CardTitle>
          <CardDescription>나를 표현하는 태그를 선택해주세요 (최대 10개)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-end">
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
              <Label htmlFor="collaborationStyle">협업 스타일</Label>
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
              <Label htmlFor="strengths">장점/강점</Label>
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
              <Label htmlFor="preferredPeopleType">선호하는 동료 유형</Label>
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

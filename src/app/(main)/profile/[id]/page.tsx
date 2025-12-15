"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Briefcase,
  Building,
  ArrowLeft,
  Loader2,
  Lock,
  MessageCircle,
} from "lucide-react";

interface ProfileData {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  department?: string;
  jobRole?: string;
  officeLocation?: string;
  mbti?: string;
  hobbies: string[];
  collaborationStyle?: string;
  strengths?: string;
  preferredPeopleType?: string;
  isProfileComplete: boolean;
  isOwnProfile: boolean;
  isSameDepartment: boolean;
  commonTags: string[];
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${userId}`);
        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error || "프로필을 불러올 수 없습니다.");
        }
      } catch {
        setError("서버 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || "프로필을 찾을 수 없습니다."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to own profile page if viewing own profile
  if (profile.isOwnProfile) {
    router.replace("/profile");
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로 가기
        </Button>
        <Link href={`/messages?to=${profile.userId}`}>
          <Button>
            <MessageCircle className="w-4 h-4 mr-2" />
            메시지 보내기
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.department && (
                  <Badge variant="outline" className="gap-1">
                    <Building className="w-3 h-3" />
                    {profile.department}
                  </Badge>
                )}
                {profile.jobRole && (
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="w-3 h-3" />
                    {profile.jobRole}
                  </Badge>
                )}
                {profile.officeLocation && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.officeLocation}
                  </Badge>
                )}
                {profile.mbti && <Badge variant="secondary">{profile.mbti}</Badge>}
              </div>
              {profile.isSameDepartment && (
                <p className="text-sm text-primary mt-2">같은 부서입니다</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Tags */}
      {profile.commonTags.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">공통 관심사</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.commonTags.map((tag) => (
                <Badge key={tag} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hobbies */}
      <Card>
        <CardHeader>
          <CardTitle>취미/관심사</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.hobbies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.hobbies.map((hobby) => (
                <Badge key={hobby} variant="secondary">
                  {hobby}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              비공개 정보입니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Style */}
      <Card>
        <CardHeader>
          <CardTitle>협업 스타일</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.collaborationStyle ? (
            <p className="text-sm whitespace-pre-wrap">{profile.collaborationStyle}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              비공개 정보입니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle>장점/강점</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.strengths ? (
            <p className="text-sm whitespace-pre-wrap">{profile.strengths}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              비공개 정보입니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferred People Type */}
      <Card>
        <CardHeader>
          <CardTitle>선호하는 동료 유형</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.preferredPeopleType ? (
            <p className="text-sm whitespace-pre-wrap">{profile.preferredPeopleType}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              비공개 정보입니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

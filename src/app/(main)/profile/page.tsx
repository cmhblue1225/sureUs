import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, User, MapPin, Briefcase, Building, Globe, Users, Lock } from "lucide-react";
import type { Database, VisibilityLevel } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function VisibilityBadge({ level }: { level: VisibilityLevel }) {
  const config = {
    public: { label: "전체 공개", icon: Globe, variant: "default" as const },
    department: { label: "부서 내", icon: Users, variant: "secondary" as const },
    private: { label: "비공개", icon: Lock, variant: "outline" as const },
  };

  const { label, icon: Icon, variant } = config[level];

  return (
    <Badge variant={variant} className="gap-1 text-xs">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single<UserRow>();

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single<ProfileRow>();

  // Get tags if profile exists
  let hobbies: string[] = [];
  if (profile) {
    const { data: tags } = await supabase
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", profile.id);

    hobbies = tags?.map((t: { tag_name: string }) => t.tag_name) || [];
  }

  // If no profile, redirect to edit page
  if (!profile) {
    redirect("/profile/edit");
  }

  const visibility = profile.visibility_settings || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">내 프로필</h1>
          <p className="text-muted-foreground mt-1">
            다른 사람들에게 보여지는 프로필입니다
          </p>
        </div>
        <Link href="/profile/edit">
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            프로필 편집
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              {userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{userData?.name || "사용자"}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.department && (
                  <Badge variant="outline" className="gap-1">
                    <Building className="w-3 h-3" />
                    {profile.department}
                  </Badge>
                )}
                {profile.job_role && (
                  <Badge variant="outline" className="gap-1">
                    <Briefcase className="w-3 h-3" />
                    {profile.job_role}
                  </Badge>
                )}
                {profile.office_location && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.office_location}
                  </Badge>
                )}
                {profile.mbti && (
                  <Badge variant="secondary">{profile.mbti}</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hobbies */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>취미/관심사</CardTitle>
            <VisibilityBadge level={visibility.hobbies || "public"} />
          </div>
        </CardHeader>
        <CardContent>
          {hobbies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <Badge key={hobby} variant="secondary">
                  {hobby}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">아직 관심사가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Style */}
      {profile.collaboration_style && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>협업 스타일</CardTitle>
              <VisibilityBadge level={visibility.collaboration_style || "public"} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{profile.collaboration_style}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {profile.strengths && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>장점/강점</CardTitle>
              <VisibilityBadge level={visibility.strengths || "public"} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{profile.strengths}</p>
          </CardContent>
        </Card>
      )}

      {/* Preferred People Type */}
      {profile.preferred_people_type && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>선호하는 동료 유형</CardTitle>
              <VisibilityBadge level={visibility.preferred_people_type || "public"} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{profile.preferred_people_type}</p>
          </CardContent>
        </Card>
      )}

      {/* Profile not complete warning */}
      {!profile.is_profile_complete && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              프로필이 완성되지 않았습니다. 모든 필수 항목을 입력하면 동료 추천 기능을 사용할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

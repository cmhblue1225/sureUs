"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Users as UsersIcon, Activity } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface ClubDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  join_policy: string;
  leader_id: string;
  member_count: number;
  tags: string[];
  created_at: string;
  leader?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isMember: boolean;
  isLeader: boolean;
  memberRole: string | null;
  memberSince: string | null;
  hasPendingRequest: boolean;
  pendingRequestId: string | null;
  pendingRequestsCount: number;
  recentMembers: {
    user_id: string;
    role: string;
    joined_at: string;
    user: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  }[];
  recentPostsCount: number;
}

export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchClubDetail();
  }, [resolvedParams.id]);

  const fetchClubDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clubs/${resolvedParams.id}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error || "동호회를 불러올 수 없습니다.",
          variant: "destructive",
        });
        router.push("/clubs");
        return;
      }

      setClub(result.data);
    } catch (error) {
      console.error("Club fetch error:", error);
      toast({
        title: "오류",
        description: "동호회를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/clubs/${resolvedParams.id}/join`, {
        method: "POST",
      });
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "성공",
        description: result.data.message,
      });
      fetchClubDetail();
    } catch (error) {
      console.error("Join error:", error);
      toast({
        title: "오류",
        description: "가입 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLeave = async () => {
    try {
      const response = await fetch(`/api/clubs/${resolvedParams.id}/leave`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "성공",
        description: result.data.message,
      });
      fetchClubDetail();
    } catch (error) {
      console.error("Leave error:", error);
      toast({
        title: "오류",
        description: "탈퇴 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!club?.pendingRequestId) return;

    try {
      const response = await fetch(`/api/clubs/${resolvedParams.id}/join`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: club.pendingRequestId }),
      });
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "성공",
        description: "가입 신청이 취소되었습니다.",
      });
      fetchClubDetail();
    } catch (error) {
      console.error("Cancel request error:", error);
      toast({
        title: "오류",
        description: "신청 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">동호회를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClubHeader
        club={club}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onCancelRequest={handleCancelRequest}
      />

      <ClubTabs
        clubId={club.id}
        isMember={club.isMember}
        isLeader={club.isLeader}
        pendingRequestsCount={club.pendingRequestsCount}
      />

      {/* Home Tab Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Club Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              동호회 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">총 회원</span>
                <span className="font-medium">{club.member_count}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최근 7일 게시물</span>
                <span className="font-medium">{club.recentPostsCount}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">개설일</span>
                <span className="font-medium">
                  {new Date(club.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              최근 가입 회원
            </CardTitle>
          </CardHeader>
          <CardContent>
            {club.recentMembers.length > 0 ? (
              <div className="space-y-3">
                {club.recentMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.user.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    {member.role === "leader" && (
                      <Badge variant="outline" className="text-xs">
                        회장
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                아직 회원이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions or Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              동호회 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">카테고리</span>
                <p className="font-medium">{club.category}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">가입 방식</span>
                <p className="font-medium">
                  {club.join_policy === "public" ? "자유 가입" : "승인제"}
                </p>
              </div>
              {club.tags && club.tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">태그</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {club.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Notice for Non-Members */}
      {!club.isMember && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              동호회에 가입하면 게시판, 갤러리, 채팅 등의 기능을 이용할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

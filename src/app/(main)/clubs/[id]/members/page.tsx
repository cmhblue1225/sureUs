"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import ClubMemberList from "@/components/clubs/ClubMemberList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  profile?: {
    department: string | null;
    jobRole: string | null;
  } | null;
}

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
  recentMembers: unknown[];
  recentPostsCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export default function ClubMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
    fetchClubAndMembers();
  }, [resolvedParams.id]);

  const fetchClubAndMembers = async () => {
    try {
      setIsLoading(true);

      // Fetch club detail
      const clubResponse = await fetch(`/api/clubs/${resolvedParams.id}`);
      const clubResult = await clubResponse.json();

      if (!clubResult.success) {
        toast({
          title: "오류",
          description: clubResult.error || "동호회를 불러올 수 없습니다.",
          variant: "destructive",
        });
        router.push("/clubs");
        return;
      }

      setClub(clubResult.data);

      // Fetch members
      await fetchMembers(1);
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "오류",
        description: "데이터를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/members?page=${page}&limit=20`
      );
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (append) {
        setMembers((prev) => [...prev, ...result.data.members]);
      } else {
        setMembers(result.data.members);
      }
      setPagination(result.data.pagination);
    } catch (error) {
      console.error("Members fetch error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleKick = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/members/${userId}`,
        {
          method: "DELETE",
        }
      );
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

      // Refresh members list
      await fetchMembers(1);

      // Update club member count
      if (club) {
        setClub({ ...club, member_count: club.member_count - 1 });
      }
    } catch (error) {
      console.error("Kick error:", error);
      toast({
        title: "오류",
        description: "강퇴 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      fetchMembers(pagination.page + 1, true);
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
      <ClubHeader club={club} />

      <ClubTabs
        clubId={club.id}
        isMember={club.isMember}
        isLeader={club.isLeader}
        pendingRequestsCount={club.pendingRequestsCount}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            회원 목록 ({pagination.total}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClubMemberList
            members={members}
            isLeader={club.isLeader}
            currentUserId={currentUserId || ""}
            onKick={handleKick}
          />

          {pagination.hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  "더 보기"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

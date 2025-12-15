"use client";

import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import ClubMemberList from "@/components/clubs/ClubMemberList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useClub } from "@/contexts/ClubContext";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export default function ClubMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { toast } = useToast();
  const { club, isLoading: clubLoading, currentUserId, updateMemberCount } = useClub();
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (club) {
      fetchMembers(1);
    }
  }, [club?.id]);

  const fetchMembers = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingMembers(true);
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
      setIsLoadingMembers(false);
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
      updateMemberCount(-1);
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

  if (clubLoading) {
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
          {isLoadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

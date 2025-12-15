"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import ClubChat from "@/components/clubs/ClubChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  recentMembers: unknown[];
  recentPostsCount: number;
}

export default function ClubChatPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!club.isMember) {
    return (
      <div className="space-y-6">
        <ClubHeader club={club} />
        <ClubTabs
          clubId={club.id}
          isMember={club.isMember}
          isLeader={club.isLeader}
          pendingRequestsCount={club.pendingRequestsCount}
        />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              동호회 회원만 채팅을 이용할 수 있습니다.
            </p>
          </CardContent>
        </Card>
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
          <CardTitle>그룹 채팅</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUserId && (
            <ClubChat
              clubId={club.id}
              currentUserId={currentUserId}
              isLeader={club.isLeader}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

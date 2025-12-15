"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import JoinRequestCard from "@/components/clubs/JoinRequestCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface JoinRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
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

export default function ClubRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    fetchClubDetail();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (club?.isLeader) {
      fetchRequests(statusFilter);
    }
  }, [club, statusFilter]);

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

      // Check if user is leader
      if (!result.data.isLeader) {
        toast({
          title: "접근 불가",
          description: "회장만 가입 신청을 관리할 수 있습니다.",
          variant: "destructive",
        });
        router.push(`/clubs/${resolvedParams.id}`);
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

  const fetchRequests = async (status: string) => {
    try {
      setIsLoadingRequests(true);

      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/requests?status=${status}`
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

      setRequests(result.data);
    } catch (error) {
      console.error("Requests fetch error:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "approve" }),
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

      // Remove from current list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      // Update club member count
      if (club) {
        setClub({
          ...club,
          member_count: club.member_count + 1,
          pendingRequestsCount: Math.max(0, club.pendingRequestsCount - 1),
        });
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast({
        title: "오류",
        description: "승인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "reject" }),
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

      // Remove from current list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      // Update pending count
      if (club) {
        setClub({
          ...club,
          pendingRequestsCount: Math.max(0, club.pendingRequestsCount - 1),
        });
      }
    } catch (error) {
      console.error("Reject error:", error);
      toast({
        title: "오류",
        description: "거절 처리 중 오류가 발생했습니다.",
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
      <ClubHeader club={club} />

      <ClubTabs
        clubId={club.id}
        isMember={club.isMember}
        isLeader={club.isLeader}
        pendingRequestsCount={club.pendingRequestsCount}
      />

      <Card>
        <CardHeader>
          <CardTitle>가입 신청 관리</CardTitle>
        </CardHeader>
        <CardContent>
          {club.join_policy === "public" && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                이 동호회는 자유 가입 방식입니다. 가입 신청 없이 누구나 바로 가입할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                대기 중 {club.pendingRequestsCount > 0 && `(${club.pendingRequestsCount})`}
              </TabsTrigger>
              <TabsTrigger value="approved">승인됨</TabsTrigger>
              <TabsTrigger value="rejected">거절됨</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <JoinRequestCard
                      key={request.id}
                      request={request}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {statusFilter === "pending"
                    ? "대기 중인 가입 신청이 없습니다."
                    : statusFilter === "approved"
                    ? "승인된 신청이 없습니다."
                    : "거절된 신청이 없습니다."}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

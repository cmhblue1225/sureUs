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
import { useClub } from "@/contexts/ClubContext";

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

export default function ClubRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { club, isLoading: clubLoading, refreshClub, updateMemberCount } = useClub();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (club) {
      if (!club.isLeader) {
        toast({
          title: "접근 불가",
          description: "회장만 가입 신청을 관리할 수 있습니다.",
          variant: "destructive",
        });
        router.push(`/clubs/${resolvedParams.id}`);
        return;
      }
      setPendingCount(club.pendingRequestsCount);
      fetchRequests(statusFilter);
    }
  }, [club?.id, club?.isLeader]);

  useEffect(() => {
    if (club?.isLeader) {
      fetchRequests(statusFilter);
    }
  }, [statusFilter]);

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
      setPendingCount((prev) => Math.max(0, prev - 1));
      updateMemberCount(1);
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
      setPendingCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Reject error:", error);
      toast({
        title: "오류",
        description: "거절 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
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
        pendingRequestsCount={pendingCount}
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
                대기 중 {pendingCount > 0 && `(${pendingCount})`}
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

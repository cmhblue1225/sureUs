"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Loader2, MessageSquare } from "lucide-react";

interface JoinRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
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

interface JoinRequestCardProps {
  request: JoinRequest;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
}

export default function JoinRequestCard({
  request,
  onApprove,
  onReject,
}: JoinRequestCardProps) {
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);

  const handleApprove = async () => {
    setIsLoading("approve");
    try {
      await onApprove(request.id);
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async () => {
    setIsLoading("reject");
    try {
      await onReject(request.id);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={request.user.avatar_url || undefined} />
              <AvatarFallback>
                {request.user.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{request.user.name}</span>
                <Badge variant="outline" className="text-xs">
                  {request.status === "pending" ? "대기 중" : request.status}
                </Badge>
              </div>
              {request.profile && (
                <p className="text-sm text-muted-foreground">
                  {[request.profile.department, request.profile.jobRole]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                신청일: {new Date(request.created_at).toLocaleDateString("ko-KR")}
              </p>
              {request.message && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <MessageSquare className="h-3 w-3" />
                    가입 메시지
                  </div>
                  <p className="text-sm">{request.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isLoading !== null}
              className="bg-green-500 hover:bg-green-600"
            >
              {isLoading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">승인</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isLoading !== null}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              {isLoading === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">거절</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

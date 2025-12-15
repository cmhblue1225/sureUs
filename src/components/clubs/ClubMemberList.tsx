"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Crown, UserMinus, Loader2 } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string;
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

interface ClubMemberListProps {
  members: Member[];
  isLeader: boolean;
  currentUserId: string;
  onKick?: (userId: string) => Promise<void>;
}

export default function ClubMemberList({
  members,
  isLeader,
  currentUserId,
  onKick,
}: ClubMemberListProps) {
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);

  const handleKick = async (userId: string) => {
    if (!onKick) return;
    setKickingUserId(userId);
    try {
      await onKick(userId);
    } finally {
      setKickingUserId(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        회원이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.user.avatar_url || undefined} />
              <AvatarFallback>
                {member.user.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{member.user.name}</span>
                {member.role === "leader" && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                    <Crown className="h-3 w-3 mr-1" />
                    회장
                  </Badge>
                )}
              </div>
              {member.profile && (
                <p className="text-sm text-muted-foreground">
                  {[member.profile.department, member.profile.jobRole]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                가입일: {new Date(member.joined_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          {isLeader && member.user_id !== currentUserId && member.role !== "leader" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  disabled={kickingUserId === member.user_id}
                >
                  {kickingUserId === member.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>회원 강퇴</AlertDialogTitle>
                  <AlertDialogDescription>
                    {member.user.name}님을 정말 강퇴하시겠습니까?
                    이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleKick(member.user_id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    강퇴하기
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
}

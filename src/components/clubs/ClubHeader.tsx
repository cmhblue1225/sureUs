"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Users, Settings, LogOut, Crown, Clock, Loader2 } from "lucide-react";

interface ClubHeaderProps {
  club: {
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
  };
  onJoin?: () => void;
  onLeave?: () => void;
  onCancelRequest?: () => void;
}

const categoryColors: Record<string, string> = {
  "스포츠": "bg-green-500/10 text-green-600 border-green-200",
  "취미": "bg-purple-500/10 text-purple-600 border-purple-200",
  "자기개발": "bg-blue-500/10 text-blue-600 border-blue-200",
  "기술/IT": "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  "소셜": "bg-pink-500/10 text-pink-600 border-pink-200",
  "문화/예술": "bg-orange-500/10 text-orange-600 border-orange-200",
  "기타": "bg-gray-500/10 text-gray-600 border-gray-200",
};

export default function ClubHeader({ club, onJoin, onLeave, onCancelRequest }: ClubHeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!onJoin) return;
    setIsLoading(true);
    try {
      await onJoin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!onLeave) return;
    setIsLoading(true);
    try {
      await onLeave();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!onCancelRequest) return;
    setIsLoading(true);
    try {
      await onCancelRequest();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-[#6C63FF] to-[#8B83FF] relative">
        {club.image_url && (
          <img
            src={club.image_url}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Club Info */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{club.name}</h1>
              <Badge
                variant="outline"
                className={categoryColors[club.category] || categoryColors["기타"]}
              >
                {club.category}
              </Badge>
              {club.join_policy === "approval" && (
                <Badge variant="secondary" className="text-xs">
                  승인제
                </Badge>
              )}
            </div>

            {club.description && (
              <p className="text-muted-foreground max-w-2xl">{club.description}</p>
            )}

            {/* Tags */}
            {club.tags && club.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {club.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{club.member_count}명</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="h-4 w-4" />
                <span>회장: {club.leader?.name || "알 수 없음"}</span>
              </div>
              {club.memberSince && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    가입일: {new Date(club.memberSince).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {club.isLeader ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/clubs/${club.id}/edit`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </Button>
                {club.pendingRequestsCount > 0 && (
                  <Badge className="bg-red-500">
                    신청 {club.pendingRequestsCount}건
                  </Badge>
                )}
              </>
            ) : club.isMember ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    탈퇴하기
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>동호회 탈퇴</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말 {club.name} 동호회를 탈퇴하시겠습니까?
                      탈퇴 후에는 다시 가입 신청이 필요합니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeave}>
                      탈퇴하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : club.hasPendingRequest ? (
              <Button variant="outline" onClick={handleCancelRequest} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                신청 취소
              </Button>
            ) : (
              <Button onClick={handleJoin} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {club.join_policy === "approval" ? "가입 신청" : "가입하기"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

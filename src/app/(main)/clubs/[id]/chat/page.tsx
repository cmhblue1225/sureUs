"use client";

import { Loader2 } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import ClubChat from "@/components/clubs/ClubChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClub } from "@/contexts/ClubContext";

export default function ClubChatPage() {
  const { club, isLoading, currentUserId } = useClub();

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

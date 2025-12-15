"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export interface ClubDetail {
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

interface ClubContextValue {
  club: ClubDetail | null;
  isLoading: boolean;
  currentUserId: string | null;
  refreshClub: () => Promise<void>;
  handleJoin: () => Promise<void>;
  handleLeave: () => Promise<void>;
  handleCancelRequest: () => Promise<void>;
  updateMemberCount: (delta: number) => void;
}

const ClubContext = createContext<ClubContextValue | null>(null);

export function useClub() {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
}

interface ClubProviderProps {
  clubId: string;
  children: ReactNode;
}

export function ClubProvider({ clubId, children }: ClubProviderProps) {
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

  const fetchClubDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clubs/${clubId}`);
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
  }, [clubId, router, toast]);

  useEffect(() => {
    fetchClubDetail();
  }, [fetchClubDetail]);

  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/join`, {
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
      await fetchClubDetail();
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
      const response = await fetch(`/api/clubs/${clubId}/leave`, {
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
      await fetchClubDetail();
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
      const response = await fetch(`/api/clubs/${clubId}/join`, {
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
      await fetchClubDetail();
    } catch (error) {
      console.error("Cancel request error:", error);
      toast({
        title: "오류",
        description: "신청 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const updateMemberCount = (delta: number) => {
    if (club) {
      setClub({ ...club, member_count: club.member_count + delta });
    }
  };

  return (
    <ClubContext.Provider
      value={{
        club,
        isLoading,
        currentUserId,
        refreshClub: fetchClubDetail,
        handleJoin,
        handleLeave,
        handleCancelRequest,
        updateMemberCount,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

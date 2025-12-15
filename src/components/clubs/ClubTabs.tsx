"use client";

import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, FileText, Image, MessageCircle, Users, Bell } from "lucide-react";

interface ClubTabsProps {
  clubId: string;
  isMember: boolean;
  isLeader: boolean;
  pendingRequestsCount?: number;
}

export default function ClubTabs({
  clubId,
  isMember,
  isLeader,
  pendingRequestsCount = 0,
}: ClubTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.includes("/posts")) return "posts";
    if (pathname.includes("/gallery")) return "gallery";
    if (pathname.includes("/chat")) return "chat";
    if (pathname.includes("/members")) return "members";
    if (pathname.includes("/requests")) return "requests";
    return "home";
  };

  const activeTab = getActiveTab();

  const handleTabChange = (value: string) => {
    switch (value) {
      case "home":
        router.push(`/clubs/${clubId}`);
        break;
      case "posts":
        router.push(`/clubs/${clubId}/posts`);
        break;
      case "gallery":
        router.push(`/clubs/${clubId}/gallery`);
        break;
      case "chat":
        router.push(`/clubs/${clubId}/chat`);
        break;
      case "members":
        router.push(`/clubs/${clubId}/members`);
        break;
      case "requests":
        router.push(`/clubs/${clubId}/requests`);
        break;
      default:
        break;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start bg-card border rounded-lg h-auto p-1 overflow-x-auto">
        <TabsTrigger value="home" className="flex items-center gap-2 px-4 py-2">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">홈</span>
        </TabsTrigger>

        {isMember && (
          <>
            <TabsTrigger value="posts" className="flex items-center gap-2 px-4 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">게시판</span>
            </TabsTrigger>

            <TabsTrigger value="gallery" className="flex items-center gap-2 px-4 py-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">갤러리</span>
            </TabsTrigger>

            <TabsTrigger value="chat" className="flex items-center gap-2 px-4 py-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">채팅</span>
            </TabsTrigger>
          </>
        )}

        <TabsTrigger value="members" className="flex items-center gap-2 px-4 py-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">회원</span>
        </TabsTrigger>

        {isLeader && (
          <TabsTrigger value="requests" className="flex items-center gap-2 px-4 py-2 relative">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">가입 신청</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequestsCount > 99 ? "99+" : pendingRequestsCount}
              </span>
            )}
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}

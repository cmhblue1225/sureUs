"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  User,
  Search,
  Sparkles,
  Network,
  Users,
  MessageCircle,
  Bell,
  FileText,
  Loader2,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  PenSquare,
  UserPlus,
} from "lucide-react";

interface DashboardData {
  userName: string;
  userAvatar: string | null;
  department: string;
  jobRole: string;
  hasProfile: boolean;
  stats: {
    unreadMessages: number;
    unreadNotifications: number;
    myClubsCount: number;
    totalRecommendations: number;
  };
  myClubs: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    memberCount: number;
    imageUrl: string | null;
    role: string;
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    type: string;
    created_at: string;
    club: { id: string; name: string };
    author: { name: string; avatar_url: string | null };
  }>;
}

const postTypeConfig: Record<string, { label: string; color: string }> = {
  post: { label: "일반", color: "text-gray-600" },
  announcement: { label: "공지", color: "text-primary font-medium" },
  poll: { label: "투표", color: "text-purple-600" },
  gallery: { label: "갤러리", color: "text-blue-600" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left Column - Profile & Stats */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-3 ring-4 ring-primary/10">
                <AvatarImage src={data.userAvatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {data.userName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold">{data.userName}</h2>
              <p className="text-sm text-muted-foreground">
                {data.department} · {data.jobRole}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/messages" className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">새 메시지</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.unreadMessages}</span>
              </Link>
              <Link href="/recommendations" className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">추천 동료</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.totalRecommendations}</span>
              </Link>
              <Link href="/clubs" className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">내 동호회</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.myClubsCount}</span>
              </Link>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">알림</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.unreadNotifications}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Clubs Card */}
        {data.myClubs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>내 동호회</span>
                <Link href="/clubs" className="text-xs text-primary hover:underline font-normal">
                  전체보기
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.myClubs.slice(0, 3).map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {club.imageUrl ? (
                        <img src={club.imageUrl} alt={club.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Users className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{club.name}</p>
                      <p className="text-xs text-muted-foreground">멤버 {club.memberCount}명</p>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Center Column - Posts & Notifications */}
      <div className="col-span-12 lg:col-span-6 space-y-4">
        {/* Profile Completion Alert */}
        {!data.hasProfile && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">프로필을 완성해주세요</p>
                  <p className="text-xs text-muted-foreground">프로필을 완성하면 나와 비슷한 동료를 찾을 수 있어요</p>
                </div>
                <Link href="/profile/edit">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">작성하기</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Posts */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">동호회 최근글</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <button className="text-sm font-medium text-primary border-b-2 border-primary pb-1">전체</button>
              <button className="text-sm text-muted-foreground hover:text-foreground pb-1">공지</button>
              <button className="text-sm text-muted-foreground hover:text-foreground pb-1">일반</button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentPosts.length > 0 ? (
              <div className="divide-y">
                {data.recentPosts.map((post) => {
                  const typeInfo = postTypeConfig[post.type] || postTypeConfig.post;
                  return (
                    <Link key={post.id} href={`/clubs/${post.club.id}/posts/${post.id}`}>
                      <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-2">
                          <span className={`text-sm ${typeInfo.color}`}>[{typeInfo.label}]</span>
                          <span className="text-sm flex-1 truncate">{post.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{formatFullDate(post.created_at)}</span>
                          <span>·</span>
                          <span>{post.club.name}</span>
                          <span>·</span>
                          <span>{post.author.name}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">최근 게시글이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base">최근 알림</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentPosts.length > 0 ? (
              <div className="divide-y">
                {data.recentPosts.slice(0, 4).map((post, index) => (
                  <Link key={`notif-${index}`} href={`/clubs/${post.club.id}/posts/${post.id}`}>
                    <div className="px-4 py-3 hover:bg-muted/30 transition-colors flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={post.author.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {post.author.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="text-primary">[{post.club.name}]</span>{" "}
                          <span className="text-muted-foreground">새 게시글이 등록되었습니다.</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(post.created_at)} · {post.author.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">새로운 알림이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Quick Actions & Calendar */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        {/* sureUs Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2">
              <Network className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-primary">sureUs</span>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-1">사내 네트워킹 플랫폼</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/search">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                  <Search className="w-5 h-5 text-primary" />
                  <span className="text-xs">동료 검색</span>
                </Button>
              </Link>
              <Link href="/recommendations">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span className="text-xs">추천 동료</span>
                </Button>
              </Link>
              <Link href="/network">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                  <Network className="w-5 h-5 text-primary" />
                  <span className="text-xs">네트워크</span>
                </Button>
              </Link>
              <Link href="/clubs">
                <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1 hover:bg-primary/5 hover:border-primary/30">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-xs">동호회</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {currentMonth.getFullYear()}. {currentMonth.getMonth() + 1}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
                <div key={day} className={`py-1 font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
                  {day}
                </div>
              ))}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="py-1" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = isCurrentMonth && day === today.getDate();
                const dayOfWeek = (startingDay + i) % 7;
                return (
                  <div
                    key={day}
                    className={`py-1 text-sm rounded-full cursor-pointer hover:bg-muted
                      ${isToday ? "bg-primary text-white font-bold" : ""}
                      ${dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : ""}
                    `}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Today's Schedule */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-primary">{today.getDate()}</span>
                <span className="text-sm text-muted-foreground">
                  {["일", "월", "화", "수", "목", "금", "토"][today.getDay()]}요일
                </span>
              </div>
              <p className="text-xs text-muted-foreground">등록된 일정이 없습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

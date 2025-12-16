"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import {
  User,
  Search,
  Sparkles,
  Network,
  ArrowRight,
  MessageCircle,
  Bell,
  Users,
  FileText,
  Loader2,
  TrendingUp,
  Clock,
} from "lucide-react";

interface DashboardData {
  userName: string;
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
  post: { label: "일반", color: "bg-gray-100 text-gray-700" },
  announcement: { label: "공지", color: "bg-red-100 text-red-700" },
  poll: { label: "투표", color: "bg-purple-100 text-purple-700" },
  gallery: { label: "갤러리", color: "bg-blue-100 text-blue-700" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
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
    <div className="space-y-6">
      {/* Hero Section - Gradient Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            안녕하세요, {data.userName}님!
          </h1>
          <p className="text-white/90 text-lg">
            오늘도 sureUs에서 새로운 인연을 만나보세요
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-accent/30 blur-xl" />
      </div>

      {/* Profile Completion CTA */}
      {!data.hasProfile && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              프로필을 완성해주세요
            </CardTitle>
            <CardDescription>
              프로필을 완성하면 나와 비슷한 관심사를 가진 동료를 찾을 수 있어요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/profile/edit">
              <Button className="bg-primary hover:bg-primary/90">
                프로필 작성하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/recommendations">
          <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">추천 동료</p>
                  <p className="text-2xl font-bold text-primary">{data.stats.totalRecommendations}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/messages">
          <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">새 메시지</p>
                  <p className="text-2xl font-bold text-blue-600">{data.stats.unreadMessages}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clubs">
          <Card className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">내 동호회</p>
                  <p className="text-2xl font-bold text-green-600">{data.stats.myClubsCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">알림</p>
                <p className="text-2xl font-bold text-amber-600">{data.stats.unreadNotifications}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              빠른 탐색
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/search" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">동료 검색</p>
                  <p className="text-xs text-muted-foreground">이름, 부서로 검색</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/recommendations" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">추천 동료</p>
                  <p className="text-xs text-muted-foreground">나와 비슷한 동료 발견</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/network" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">네트워크 그래프</p>
                  <p className="text-xs text-muted-foreground">관계망 시각화</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>

            <Link href="/clubs" className="block">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">동호회</p>
                  <p className="text-xs text-muted-foreground">관심사 기반 모임</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              최근 동호회 활동
            </CardTitle>
            {data.recentPosts.length > 0 && (
              <Link href="/clubs">
                <Button variant="ghost" size="sm" className="text-primary">
                  전체보기
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {data.recentPosts.length > 0 ? (
              <div className="space-y-4">
                {data.recentPosts.map((post) => {
                  const typeInfo = postTypeConfig[post.type] || postTypeConfig.post;
                  return (
                    <Link
                      key={post.id}
                      href={`/clubs/${post.club.id}/posts/${post.id}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={post.author.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {post.author.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium truncate">
                              {post.author.name}
                            </span>
                            <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground truncate">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {post.club.name}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(post.created_at)}
                            </span>
                          </div>
                        </div>
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  아직 동호회 활동이 없어요
                </p>
                <Link href="/clubs">
                  <Button variant="outline" size="sm">
                    동호회 둘러보기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Clubs */}
      {data.myClubs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              내 동호회
            </CardTitle>
            <Link href="/clubs">
              <Button variant="ghost" size="sm" className="text-primary">
                전체보기
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.myClubs.map((club) => (
                <Link key={club.id} href={`/clubs/${club.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      {club.imageUrl ? (
                        <img
                          src={club.imageUrl}
                          alt={club.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{club.name}</p>
                        {club.role === "leader" && (
                          <Badge variant="secondary" className="text-xs py-0">
                            리더
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        멤버 {club.memberCount}명
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
  Bell,
  FileText,
  Loader2,
  Mail,
  ChevronRight,
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

      {/* Top Section: Profile + Stats */}
      <div className="grid grid-cols-12 gap-4">
        {/* Profile Card */}
        <Card className="col-span-12 md:col-span-4 lg:col-span-3">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 mb-3 ring-4 ring-primary/10">
                <AvatarImage src={data.userAvatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {data.userName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold">{data.userName}</h2>
              {(data.department || data.jobRole) && (
                <p className="text-sm text-muted-foreground">
                  {[data.department, data.jobRole].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <div className="mt-6 space-y-1">
              <Link href="/messages" className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">새 메시지</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.unreadMessages}</span>
              </Link>
              <Link href="/recommendations" className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">추천 동료</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.totalRecommendations}</span>
              </Link>
              <Link href="/clubs" className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">내 동호회</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.myClubsCount}</span>
              </Link>
              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">알림</span>
                </div>
                <span className="text-sm font-semibold text-primary">{data.stats.unreadNotifications}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-12 md:col-span-8 lg:col-span-9">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">빠른 메뉴</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/search">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">동료 검색</span>
                  <span className="text-xs text-muted-foreground">이름, 부서로 검색</span>
                </div>
              </Link>
              <Link href="/recommendations">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">추천 동료</span>
                  <span className="text-xs text-muted-foreground">나와 비슷한 동료</span>
                </div>
              </Link>
              <Link href="/network">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Network className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">네트워크</span>
                  <span className="text-xs text-muted-foreground">관계망 시각화</span>
                </div>
              </Link>
              <Link href="/clubs">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">동호회</span>
                  <span className="text-xs text-muted-foreground">관심사 기반 모임</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Posts + Clubs/Notifications */}
      <div className="grid grid-cols-12 gap-4">
        {/* Recent Posts */}
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">동호회 최근글</CardTitle>
              <Link href="/clubs" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                전체보기 <ChevronRight className="w-3 h-3" />
              </Link>
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
                          <span className={`text-sm shrink-0 ${typeInfo.color}`}>[{typeInfo.label}]</span>
                          <span className="text-sm flex-1 line-clamp-1">{post.title}</span>
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
                <Link href="/clubs">
                  <Button variant="outline" size="sm" className="mt-3">
                    동호회 둘러보기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: My Clubs + Notifications */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* My Clubs */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">내 동호회</CardTitle>
                <Link href="/clubs" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  전체보기 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.myClubs.length > 0 ? (
                <div className="divide-y">
                  {data.myClubs.slice(0, 4).map((club) => (
                    <Link key={club.id} href={`/clubs/${club.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">가입한 동호회가 없습니다</p>
                  <Link href="/clubs">
                    <Button variant="outline" size="sm" className="mt-3">
                      동호회 찾기
                    </Button>
                  </Link>
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
                  {data.recentPosts.slice(0, 3).map((post, index) => (
                    <Link key={`notif-${index}`} href={`/clubs/${post.club.id}/posts/${post.id}`}>
                      <div className="px-4 py-3 hover:bg-muted/30 transition-colors flex items-start gap-3">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarImage src={post.author.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {post.author.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2">
                            <span className="text-primary font-medium">{post.club.name}</span>에 새 글이 등록되었습니다.
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(post.created_at)}
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
      </div>
    </div>
  );
}

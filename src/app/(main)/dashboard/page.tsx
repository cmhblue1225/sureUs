"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  User,
  Sparkles,
  Users,
  Bell,
  FileText,
  Loader2,
  Mail,
  ChevronRight,
  Vote,
  Clock,
  TrendingUp,
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
  // 새로 추가된 필드
  profileCompletion: {
    percentage: number;
    completedFields: string[];
    missingFields: string[];
  };
  activePolls: Array<{
    postId: string;
    clubId: string;
    clubName: string;
    question: string;
    optionCount: number;
    endDate: string | null;
    totalVotes: number;
  }>;
  recommendedColleagues: Array<{
    id: string;
    name: string;
    department: string;
    jobRole: string;
    avatarUrl: string | null;
    matchScore: number;
  }>;
  recommendedClubs: Array<{
    id: string;
    name: string;
    category: string;
    memberCount: number;
    imageUrl: string | null;
    score: number;
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

  // 마감시간 포맷
  const formatEndDate = (dateString: string | null) => {
    if (!dateString) return "마감 없음";
    const endDate = new Date(dateString);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}일 남음`;
    if (diffHours > 0) return `${diffHours}시간 남음`;
    return "곧 마감";
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner */}
      {data.profileCompletion && data.profileCompletion.percentage < 100 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">프로필 완성도</p>
                  <span className="text-sm font-bold text-primary">{data.profileCompletion.percentage}%</span>
                </div>
                <Progress value={data.profileCompletion.percentage} className="h-2" />
                {data.profileCompletion.missingFields.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    미완성: {data.profileCompletion.missingFields.slice(0, 3).join(", ")}
                    {data.profileCompletion.missingFields.length > 3 && ` 외 ${data.profileCompletion.missingFields.length - 3}개`}
                  </p>
                )}
              </div>
              <Link href="/profile/edit">
                <Button size="sm" className="bg-primary hover:bg-primary/90 shrink-0">완성하기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Profile Card */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-3">
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

        {/* Recent Posts */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-5">
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

      {/* Bottom Row: Recommendations */}
      <div className="grid grid-cols-12 gap-4">
        {/* Recommended Colleagues */}
        <Card className="col-span-12 lg:col-span-6">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                추천 동료
              </CardTitle>
              <Link href="/recommendations" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                더보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {data.recommendedColleagues && data.recommendedColleagues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.recommendedColleagues.map((colleague) => (
                  <Link key={colleague.id} href={`/profile/${colleague.id}`}>
                    <div className="flex flex-col items-center p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-colors text-center">
                      <Avatar className="w-12 h-12 mb-2 ring-2 ring-primary/10">
                        <AvatarImage src={colleague.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {colleague.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate w-full">{colleague.name}</p>
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {colleague.department || colleague.jobRole || "-"}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {colleague.matchScore}% 매칭
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">프로필을 완성하면 추천 동료를 볼 수 있어요</p>
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm" className="mt-3">
                    프로필 작성하기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Club Recommendations + Active Polls */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          {/* Recommended Clubs */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  추천 동호회
                </CardTitle>
                <Link href="/clubs" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  더보기 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.recommendedClubs && data.recommendedClubs.length > 0 ? (
                <div className="divide-y">
                  {data.recommendedClubs.map((club) => (
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs py-0">{club.category}</Badge>
                            <span>멤버 {club.memberCount}명</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">추천할 동호회가 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Polls */}
          {data.activePolls && data.activePolls.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Vote className="w-4 h-4 text-purple-500" />
                  진행 중인 투표
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.activePolls.map((poll) => (
                    <Link key={poll.postId} href={`/clubs/${poll.clubId}/posts/${poll.postId}`}>
                      <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{poll.question}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="text-primary">{poll.clubName}</span>
                              <span>·</span>
                              <span>{poll.optionCount}개 선택지</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-orange-500 shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>{formatEndDate(poll.endDate)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  User,
  Bell,
  FileText,
  Loader2,
  ChevronRight,
  Calendar,
  MessageSquare,
  Megaphone,
  Heart,
  MapPin,
  Clock,
} from "lucide-react";

interface DashboardData {
  userName: string;
  userAvatar: string | null;
  department: string;
  jobRole: string;
  hasProfile: boolean;
  stats: {
    unreadNotifications: number;
    totalRecommendations: number;
  };
  profileCompletion: {
    percentage: number;
    completedFields: string[];
    missingFields: string[];
  };
  recentAnnouncements: Array<{
    id: string;
    title: string;
    category: string;
    isImportant: boolean;
    isPinned: boolean;
    createdAt: string;
    author: { name: string; avatar_url: string | null };
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    eventType: string;
    startDate: string;
    endDate: string;
    location: string | null;
    color: string;
    allDay: boolean;
  }>;
  recentBoardPosts: Array<{
    id: string;
    title: string;
    postType: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    author: { name: string; avatar_url: string | null };
  }>;
}

const postTypeConfig: Record<string, { label: string; color: string }> = {
  general: { label: "일반", color: "text-gray-600" },
  gallery: { label: "갤러리", color: "text-blue-600" },
  poll: { label: "투표", color: "text-purple-600" },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  notice: { label: "공지", color: "bg-blue-100 text-blue-700" },
  training: { label: "교육", color: "bg-green-100 text-green-700" },
  event: { label: "이벤트", color: "bg-purple-100 text-purple-700" },
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
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
              <UserAvatar
                src={data.userAvatar}
                alt={data.userName}
                size="xl"
                className="mb-3 ring-4 ring-primary/10"
              />
              <h2 className="text-lg font-bold">{data.userName}</h2>
              {(data.department || data.jobRole) && (
                <p className="text-sm text-muted-foreground">
                  {[data.department, data.jobRole].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>

            <div className="mt-6 space-y-1">
              <Link href="/calendar" className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">캘린더</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              <Link href="/board" className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">게시판</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              <Link href="/announcements" className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">공지사항</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
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

        {/* Recent Announcements */}
        <Card className="col-span-12 md:col-span-6 lg:col-span-5">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                공지사항
              </CardTitle>
              <Link href="/announcements" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                전체보기 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentAnnouncements && data.recentAnnouncements.length > 0 ? (
              <div className="divide-y">
                {data.recentAnnouncements.map((announcement) => {
                  const catInfo = categoryConfig[announcement.category] || categoryConfig.notice;
                  return (
                    <Link key={announcement.id} href={`/announcements/${announcement.id}`}>
                      <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-2">
                          {announcement.isImportant && (
                            <Badge variant="destructive" className="text-xs shrink-0">중요</Badge>
                          )}
                          <Badge className={`text-xs shrink-0 ${catInfo.color}`}>{catInfo.label}</Badge>
                          <span className="text-sm flex-1 line-clamp-1">{announcement.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{formatDate(announcement.createdAt)}</span>
                          <span>·</span>
                          <span>{announcement.author.name}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">공지사항이 없습니다</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Upcoming Events + Recent Board Posts */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  다가오는 일정
                </CardTitle>
                <Link href="/calendar" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  전체보기 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
                <div className="divide-y">
                  {data.upcomingEvents.slice(0, 4).map((event) => (
                    <Link key={event.id} href="/calendar">
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div
                          className="w-2 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: event.color || '#3B82F6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatEventDate(event.startDate)}</span>
                            {event.location && (
                              <>
                                <MapPin className="w-3 h-3 ml-1" />
                                <span className="truncate">{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant={event.eventType === 'training' ? 'default' : 'outline'} className="text-xs shrink-0">
                          {event.eventType === 'training' ? '교육' : '개인'}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">예정된 일정이 없습니다</p>
                  <Link href="/calendar">
                    <Button variant="outline" size="sm" className="mt-3">
                      캘린더 보기
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Board Posts */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  최근 게시물
                </CardTitle>
                <Link href="/board" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                  전체보기 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentBoardPosts && data.recentBoardPosts.length > 0 ? (
                <div className="divide-y">
                  {data.recentBoardPosts.slice(0, 3).map((post) => {
                    const typeInfo = postTypeConfig[post.postType] || postTypeConfig.general;
                    return (
                      <Link key={post.id} href={`/board/${post.id}`}>
                        <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start gap-2">
                            <span className={`text-xs shrink-0 ${typeInfo.color}`}>[{typeInfo.label}]</span>
                            <span className="text-sm flex-1 line-clamp-1">{post.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{post.author.name}</span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> {post.commentCount}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">최근 게시물이 없습니다</p>
                  <Link href="/board/new">
                    <Button variant="outline" size="sm" className="mt-3">
                      글 작성하기
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

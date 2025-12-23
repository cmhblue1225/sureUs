"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Pin,
  AlertCircle,
  Eye,
  MessageCircle,
  Paperclip,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "notice" | "training" | "event";
  is_important: boolean;
  is_pinned: boolean;
  view_count: number;
  comment_count: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  files: { id: string; file_name: string }[];
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const categoryLabels: Record<string, string> = {
  notice: "공지",
  training: "교육",
  event: "이벤트",
};

const categoryColors: Record<string, string> = {
  notice: "bg-blue-100 text-blue-800",
  training: "bg-green-100 text-green-800",
  event: "bg-purple-100 text-purple-800",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (category !== "all") {
        params.append("category", category);
      }

      const res = await fetch(`/api/announcements?${params}`);
      const data = await res.json();

      if (data.success) {
        setAnnouncements(data.data);
        setMeta(data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, category]);

  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/me");
      const data = await res.json();
      if (data.success) {
        setIsAdmin(data.data.role === "admin");
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      announcement.title.toLowerCase().includes(query) ||
      announcement.content.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">공지사항</h1>
        {isAdmin && (
          <Link href="/announcements/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              공지 작성
            </Button>
          </Link>
        )}
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="공지사항 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="notice">공지</SelectItem>
            <SelectItem value="training">교육</SelectItem>
            <SelectItem value="event">이벤트</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 공지 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">공지사항이 없습니다.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
            >
              <Card
                className={cn(
                  "p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                  announcement.is_important && "border-l-4 border-l-red-500",
                  announcement.is_pinned && "bg-accent/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {announcement.is_pinned && (
                        <Pin className="w-4 h-4 text-primary" />
                      )}
                      {announcement.is_important && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <Badge
                        variant="secondary"
                        className={categoryColors[announcement.category]}
                      >
                        {categoryLabels[announcement.category]}
                      </Badge>
                      <h3 className="font-medium truncate">
                        {announcement.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{announcement.author.name}</span>
                      <span>{formatDate(announcement.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {announcement.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {announcement.comment_count}
                      </span>
                      {announcement.files.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {announcement.files.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4 text-sm">
            {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

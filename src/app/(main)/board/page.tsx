"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  MessageCircle,
  Heart,
  Eye,
  Image as ImageIcon,
  BarChart3,
  Loader2,
  Pin,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BoardPost {
  id: string;
  title: string;
  content: string;
  post_type: "general" | "gallery" | "poll";
  image_urls: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isLiked: boolean;
}

const postTypeLabels = {
  general: "일반",
  gallery: "갤러리",
  poll: "투표",
};

const postTypeIcons = {
  general: MessageCircle,
  gallery: ImageIcon,
  poll: BarChart3,
};

export default function BoardPage() {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        type: filterType,
      });
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await fetch(`/api/board/posts?${params}`);
      const data = await res.json();

      if (data.success) {
        setPosts(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterType, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">게시판</h1>
          <p className="text-muted-foreground">
            동기들과 자유롭게 소통해보세요
          </p>
        </div>
        <Link href="/board/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            글쓰기
          </Button>
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            placeholder="검색어를 입력하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex gap-2">
          {["all", "general", "gallery", "poll"].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterType(type);
                setPage(1);
              }}
            >
              {type === "all" ? "전체" : postTypeLabels[type as keyof typeof postTypeLabels]}
            </Button>
          ))}
        </div>
      </div>

      {/* 게시물 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">게시물이 없습니다.</p>
          <Link href="/board/new">
            <Button className="mt-4">첫 게시물 작성하기</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const TypeIcon = postTypeIcons[post.post_type];
            return (
              <Link key={post.id} href={`/board/${post.id}`}>
                <Card
                  className={cn(
                    "p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                    post.is_pinned && "border-primary"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.author.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.author.name?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_pinned && (
                          <Pin className="w-4 h-4 text-primary" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {postTypeLabels[post.post_type]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {post.author.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <h3 className="font-semibold truncate">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {post.content}
                      </p>
                      {post.image_urls?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {post.image_urls.slice(0, 3).map((url, i) => (
                            <div
                              key={i}
                              className="w-16 h-16 rounded bg-muted overflow-hidden"
                            >
                              <img
                                src={url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {post.image_urls.length > 3 && (
                            <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                              +{post.image_urls.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.view_count}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            post.isLiked && "text-red-500"
                          )}
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4",
                              post.isLiked && "fill-current"
                            )}
                          />
                          {post.like_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comment_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}

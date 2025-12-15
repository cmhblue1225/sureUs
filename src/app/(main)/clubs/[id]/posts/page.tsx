"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FileText, Megaphone, BarChart2, Image } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import PostCard from "@/components/clubs/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  club_id: string;
  type: string;
  title: string;
  content: string | null;
  image_urls: string[];
  is_pinned: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isLiked: boolean;
  isAuthor: boolean;
}

interface ClubDetail {
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
  recentMembers: unknown[];
  recentPostsCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export default function ClubPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchClubAndPosts();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (club?.isMember) {
      fetchPosts(1, typeFilter);
    }
  }, [typeFilter, club?.isMember]);

  const fetchClubAndPosts = async () => {
    try {
      setIsLoading(true);

      // Fetch club detail
      const clubResponse = await fetch(`/api/clubs/${resolvedParams.id}`);
      const clubResult = await clubResponse.json();

      if (!clubResult.success) {
        toast({
          title: "오류",
          description: clubResult.error || "동호회를 불러올 수 없습니다.",
          variant: "destructive",
        });
        router.push("/clubs");
        return;
      }

      setClub(clubResult.data);

      // Only fetch posts if member
      if (clubResult.data.isMember) {
        await fetchPosts(1, typeFilter);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "오류",
        description: "데이터를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async (page: number, type: string, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      }

      const typeParam = type !== "all" ? `&type=${type}` : "";
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts?page=${page}&limit=20${typeParam}`
      );
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (append) {
        setPosts((prev) => [...prev, ...result.data.posts]);
      } else {
        setPosts(result.data.posts);
      }
      setPagination(result.data.pagination);
    } catch (error) {
      console.error("Posts fetch error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${postId}/like`,
        { method: "POST" }
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: result.data.isLiked,
                like_count: result.data.likeCount,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Like error:", error);
      toast({
        title: "오류",
        description: "좋아요 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${postId}`,
        { method: "DELETE" }
      );
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
        description: "게시물이 삭제되었습니다.",
      });

      // Remove from local state
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "오류",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleLoadMore = () => {
    if (pagination.hasMore && !isLoadingMore) {
      fetchPosts(pagination.page + 1, typeFilter, true);
    }
  };

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
              동호회 회원만 게시판을 이용할 수 있습니다.
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>게시판</CardTitle>
          <Button onClick={() => router.push(`/clubs/${club.id}/posts/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            글쓰기
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={typeFilter} onValueChange={setTypeFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="announcement" className="flex items-center gap-1">
                <Megaphone className="h-3 w-3" />
                공지
              </TabsTrigger>
              <TabsTrigger value="post" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                일반
              </TabsTrigger>
              <TabsTrigger value="poll" className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                투표
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                갤러리
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                />
              ))}

              {pagination.hasMore && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      "더 보기"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 게시물이 없습니다.</p>
              <p className="text-sm">첫 번째 게시물을 작성해보세요!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

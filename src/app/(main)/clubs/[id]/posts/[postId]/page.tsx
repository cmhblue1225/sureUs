"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Heart,
  MessageCircle,
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PollCard from "@/components/clubs/PollCard";
import { useToast } from "@/hooks/use-toast";

interface PostDetail {
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
  updated_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isLiked: boolean;
  isAuthor: boolean;
  isLeader: boolean;
  pollData: {
    id: string;
    question: string;
    options: string[];
    allow_multiple: boolean;
    end_date: string | null;
    is_closed: boolean;
    voteCounts: Record<number, number>;
    totalVotes: number;
    userVote: number[] | null;
    hasVoted: boolean;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isAuthor: boolean;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  post: { label: "일반", color: "bg-gray-500/10 text-gray-600" },
  announcement: { label: "공지", color: "bg-red-500/10 text-red-600" },
  poll: { label: "투표", color: "bg-purple-500/10 text-purple-600" },
  gallery: { label: "갤러리", color: "bg-blue-500/10 text-blue-600" },
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPostDetail();
    fetchComments();
  }, [resolvedParams.id, resolvedParams.postId]);

  const fetchPostDetail = async () => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}`
      );
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error || "게시물을 불러올 수 없습니다.",
          variant: "destructive",
        });
        router.push(`/clubs/${resolvedParams.id}/posts`);
        return;
      }

      setPost(result.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "오류",
        description: "게시물을 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}/comments`
      );
      const result = await response.json();

      if (result.success) {
        setComments(result.data);
      }
    } catch (error) {
      console.error("Comments fetch error:", error);
    }
  };

  const handleLike = async () => {
    if (!post || isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}/like`,
        { method: "POST" }
      );
      const result = await response.json();

      if (result.success) {
        setPost({
          ...post,
          isLiked: result.data.isLiked,
          like_count: result.data.likeCount,
        });
      }
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!post || isDeleting) return;

    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (result.success) {
        toast({
          title: "성공",
          description: "게시물이 삭제되었습니다.",
        });
        router.push(`/clubs/${resolvedParams.id}/posts`);
      } else {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "오류",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      );
      const result = await response.json();

      if (result.success) {
        setComments([...comments, result.data]);
        setNewComment("");
        if (post) {
          setPost({ ...post, comment_count: post.comment_count + 1 });
        }
      } else {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Comment submit error:", error);
      toast({
        title: "오류",
        description: "댓글 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}/comments`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId }),
        }
      );
      const result = await response.json();

      if (result.success) {
        setComments(comments.filter((c) => c.id !== commentId));
        if (post) {
          setPost({ ...post, comment_count: post.comment_count - 1 });
        }
      } else {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Comment delete error:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">게시물을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const typeInfo = typeConfig[post.type] || typeConfig.post;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link
          href={`/clubs/${resolvedParams.id}/posts`}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          게시판으로 돌아가기
        </Link>
      </div>

      {/* Post Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(post.created_at)}
                  {post.updated_at !== post.created_at && " (수정됨)"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.is_pinned && <Pin className="h-4 w-4 text-orange-500" />}
              <Badge variant="outline" className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
              {(post.isAuthor || post.isLeader) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(
                          `/clubs/${resolvedParams.id}/posts/${resolvedParams.postId}/edit`
                        )
                      }
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-500"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-xl font-bold">{post.title}</h1>

          {/* Poll Content */}
          {post.type === "poll" && post.pollData && (
            <PollCard
              pollData={post.pollData}
              clubId={resolvedParams.id}
              postId={resolvedParams.postId}
              voteCounts={post.pollData.voteCounts}
              totalVotes={post.pollData.totalVotes}
              userVote={post.pollData.userVote}
              hasVoted={post.pollData.hasVoted}
              onVoteUpdate={fetchPostDetail}
            />
          )}

          {/* Regular Content */}
          {post.content && post.type !== "poll" && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {/* Images */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.image_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`이미지 ${index + 1}`}
                  className="rounded-lg object-cover w-full aspect-square"
                />
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${post.isLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart
                className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`}
              />
              <span>{post.like_count}</span>
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comment_count}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">댓글 {post.comment_count}개</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Input */}
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          <Separator />

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.author.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      {comment.isAuthor && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-4">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

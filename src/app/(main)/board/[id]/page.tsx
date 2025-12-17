"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Loader2,
  Trash2,
  Edit,
  Send,
  BarChart3,
  CheckCircle,
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
  isAuthor: boolean;
  poll?: {
    id: string;
    options: { id: string; text: string; count: number }[];
    multiple_choice: boolean;
    ends_at: string | null;
  };
  userVote?: string[];
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
  replies: Comment[];
}

export default function BoardPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<BoardPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVotes, setSelectedVotes] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/board/posts/${postId}`);
      const data = await res.json();

      if (data.success) {
        setPost(data.data);
        if (data.data.userVote) {
          setSelectedVotes(data.data.userVote);
        }
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/board/posts/${postId}/comments`);
      const data = await res.json();

      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleLike = async () => {
    if (!post) return;

    try {
      const res = await fetch(`/api/board/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setPost({
          ...post,
          isLiked: data.data.liked,
          like_count: post.like_count + (data.data.liked ? 1 : -1),
        });
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/board/posts/${postId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        router.push("/board");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/board/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();

      if (data.success) {
        setNewComment("");
        fetchComments();
        if (post) {
          setPost({ ...post, comment_count: post.comment_count + 1 });
        }
      }
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async () => {
    if (selectedVotes.length === 0) {
      alert("투표할 옵션을 선택해주세요.");
      return;
    }

    setIsVoting(true);
    try {
      const res = await fetch(`/api/board/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds: selectedVotes }),
      });
      const data = await res.json();

      if (data.success && post?.poll) {
        setPost({
          ...post,
          poll: { ...post.poll, options: data.data.options },
          userVote: data.data.userVote,
        });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground mb-4">게시물을 찾을 수 없습니다.</p>
        <Link href="/board">
          <Button>게시판으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const totalVotes = post.poll?.options.reduce((sum, opt) => sum + opt.count, 0) || 0;

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/board"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          게시판으로 돌아가기
        </Link>
      </div>

      <Card className="p-6 mb-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author.avatar_url || undefined} />
              <AvatarFallback>{post.author.name?.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(post.created_at)}
              </p>
            </div>
          </div>
          {post.isAuthor && (
            <div className="flex gap-2">
              <Link href={`/board/${post.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  수정
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                삭제
              </Button>
            </div>
          )}
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

        {/* 내용 */}
        <div className="prose prose-sm max-w-none mb-4 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* 이미지 */}
        {post.image_urls?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {post.image_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="rounded-lg w-full object-cover"
              />
            ))}
          </div>
        )}

        {/* 투표 */}
        {post.post_type === "poll" && post.poll && (
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">투표</span>
              {post.poll.multiple_choice && (
                <Badge variant="outline">복수 선택</Badge>
              )}
              {post.poll.ends_at && (
                <span className="text-sm text-muted-foreground">
                  ~{new Date(post.poll.ends_at).toLocaleDateString("ko-KR")}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {post.poll.options.map((option) => {
                const percentage = totalVotes > 0 ? (option.count / totalVotes) * 100 : 0;
                const isSelected = selectedVotes.includes(option.id);
                const hasVoted = post.userVote && post.userVote.length > 0;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative border rounded-lg p-3 cursor-pointer transition-colors",
                      isSelected && "border-primary bg-primary/5"
                    )}
                    onClick={() => {
                      if (post.poll?.multiple_choice) {
                        setSelectedVotes(
                          isSelected
                            ? selectedVotes.filter((id) => id !== option.id)
                            : [...selectedVotes, option.id]
                        );
                      } else {
                        setSelectedVotes([option.id]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-primary" />
                        )}
                        <span>{option.text}</span>
                      </div>
                      {hasVoted && (
                        <span className="text-sm text-muted-foreground">
                          {option.count}표 ({percentage.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    {hasVoted && (
                      <div
                        className="absolute inset-0 bg-primary/10 rounded-lg"
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                총 {totalVotes}표
              </span>
              <Button onClick={handleVote} disabled={isVoting}>
                {isVoting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {post.userVote ? "재투표" : "투표하기"}
              </Button>
            </div>
          </div>
        )}

        {/* 액션 */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn(post.isLiked && "text-red-500")}
          >
            <Heart
              className={cn("w-4 h-4 mr-1", post.isLiked && "fill-current")}
            />
            {post.like_count}
          </Button>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {post.comment_count}
          </span>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {post.view_count}
          </span>
        </div>
      </Card>

      {/* 댓글 섹션 */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">댓글 {post.comment_count}개</h2>

        {/* 댓글 작성 */}
        <form onSubmit={handleSubmitComment} className="flex gap-2 mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={2}
            className="flex-1"
          />
          <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              첫 댓글을 남겨보세요!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.author.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.author.name?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시물을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

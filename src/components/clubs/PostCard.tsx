"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  BarChart2,
  Image as ImageIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: {
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
  };
  onLike?: (postId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  post: { label: "일반", color: "bg-gray-500/10 text-gray-600" },
  announcement: { label: "공지", color: "bg-red-500/10 text-red-600" },
  poll: { label: "투표", color: "bg-purple-500/10 text-purple-600" },
  gallery: { label: "갤러리", color: "bg-blue-500/10 text-blue-600" },
};

export default function PostCard({ post, onLike, onDelete }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onLike || isLiking) return;

    setIsLiking(true);
    // Optimistic update
    setLocalLiked(!localLiked);
    setLocalLikeCount(localLiked ? localLikeCount - 1 : localLikeCount + 1);

    try {
      await onLike(post.id);
    } catch {
      // Revert on error
      setLocalLiked(localLiked);
      setLocalLikeCount(post.like_count);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || isDeleting) return;

    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const typeInfo = typeConfig[post.type] || typeConfig.post;

  return (
    <Link href={`/clubs/${post.club_id}/posts/${post.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback>
                  {post.author.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {post.is_pinned && (
                <Pin className="h-4 w-4 text-orange-500" />
              )}
              <Badge variant="outline" className={typeInfo.color}>
                {post.type === "poll" && <BarChart2 className="h-3 w-3 mr-1" />}
                {post.type === "gallery" && <ImageIcon className="h-3 w-3 mr-1" />}
                {typeInfo.label}
              </Badge>
              {post.isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
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
        <CardContent className="pb-2">
          <h3 className="font-semibold mb-1">{post.title}</h3>
          {post.content && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.content}
            </p>
          )}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>이미지 {post.image_urls.length}개</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1 ${localLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-4 w-4 ${localLiked ? "fill-current" : ""}`} />
              <span>{localLikeCount}</span>
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>{post.comment_count}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

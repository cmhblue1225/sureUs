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
  Eye,
  Loader2,
  Trash2,
  Edit,
  Send,
  Download,
  FileIcon,
  Pin,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AnnouncementFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  download_count: number;
}

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
  files: AnnouncementFile[];
  isAdmin: boolean;
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

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`);
      const data = await res.json();

      if (data.success) {
        setAnnouncement(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch announcement:", error);
    } finally {
      setIsLoading(false);
    }
  }, [announcementId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}/comments`);
      const data = await res.json();

      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [announcementId]);

  useEffect(() => {
    fetchAnnouncement();
    fetchComments();
  }, [fetchAnnouncement, fetchComments]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        router.push("/announcements");
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
      const res = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();

      if (data.success) {
        setNewComment("");
        fetchComments();
        if (announcement) {
          setAnnouncement({
            ...announcement,
            comment_count: announcement.comment_count + 1,
          });
        }
      }
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (file: AnnouncementFile) => {
    try {
      // 다운로드 카운트 증가는 백엔드에서 처리
      window.open(file.file_url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-muted-foreground mb-4">공지를 찾을 수 없습니다.</p>
        <Link href="/announcements">
          <Button>공지사항으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/announcements"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          공지사항으로 돌아가기
        </Link>
      </div>

      <Card className="p-6 mb-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={announcement.author.avatar_url || undefined} />
              <AvatarFallback>
                {announcement.author.name?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{announcement.author.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(announcement.created_at)}
              </p>
            </div>
          </div>
          {announcement.isAdmin && (
            <div className="flex gap-2">
              <Link href={`/announcements/${announcement.id}/edit`}>
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

        {/* 배지 */}
        <div className="flex items-center gap-2 mb-3">
          {announcement.is_pinned && <Pin className="w-4 h-4 text-primary" />}
          {announcement.is_important && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <Badge
            variant="secondary"
            className={categoryColors[announcement.category]}
          >
            {categoryLabels[announcement.category]}
          </Badge>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold mb-4">{announcement.title}</h1>

        {/* 내용 */}
        <div className="prose prose-sm max-w-none mb-4 whitespace-pre-wrap">
          {announcement.content}
        </div>

        {/* 첨부파일 */}
        {announcement.files.length > 0 && (
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-3">
              첨부파일 ({announcement.files.length})
            </h3>
            <div className="space-y-2">
              {announcement.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-accent/50 rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{file.file_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({formatFileSize(file.file_size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    다운로드
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 조회수 */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            조회 {announcement.view_count}
          </span>
        </div>
      </Card>

      {/* 댓글 섹션 */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">
          댓글 {announcement.comment_count}개
        </h2>

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
            <AlertDialogTitle>공지를 삭제하시겠습니까?</AlertDialogTitle>
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

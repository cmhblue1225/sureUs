"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditAnnouncementPage() {
  const params = useParams();
  const router = useRouter();
  const announcementId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"notice" | "training" | "event">("notice");
  const [isImportant, setIsImportant] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const res = await fetch(`/api/announcements/${announcementId}`);
      const data = await res.json();

      if (data.success) {
        const ann = data.data;
        setTitle(ann.title);
        setContent(ann.content);
        setCategory(ann.category);
        setIsImportant(ann.is_important);
        setIsPinned(ann.is_pinned);
        setIsAdmin(ann.isAdmin);

        if (!ann.isAdmin) {
          router.push(`/announcements/${announcementId}`);
        }
      } else {
        router.push("/announcements");
      }
    } catch (error) {
      console.error("Failed to fetch announcement:", error);
      router.push("/announcements");
    } finally {
      setIsFetching(false);
    }
  }, [announcementId, router]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/announcements/${announcementId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          isImportant,
          isPinned,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/announcements/${announcementId}`);
      } else {
        alert(data.error || "공지 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update announcement error:", error);
      alert("공지 수정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/announcements/${announcementId}`}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          공지로 돌아가기
        </Link>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">공지 수정</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) =>
                setCategory(v as "notice" | "training" | "event")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notice">공지</SelectItem>
                <SelectItem value="training">교육</SelectItem>
                <SelectItem value="event">이벤트</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목을 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="공지 내용을 입력하세요"
              rows={10}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="isImportant"
                checked={isImportant}
                onCheckedChange={(checked) => setIsImportant(!!checked)}
              />
              <Label htmlFor="isImportant" className="font-normal">
                중요 공지로 표시
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(!!checked)}
              />
              <Label htmlFor="isPinned" className="font-normal">
                상단에 고정
              </Label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              수정 완료
            </Button>
            <Link href={`/announcements/${announcementId}`}>
              <Button type="button" variant="outline">
                취소
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

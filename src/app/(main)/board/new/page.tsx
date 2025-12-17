"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, Plus, X, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function NewPostPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"general" | "gallery" | "poll">(
    "general"
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [pollEndsAt, setPollEndsAt] = useState("");

  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    if (postType === "poll") {
      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        alert("투표 옵션을 최소 2개 입력해주세요.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        postType,
        imageUrls,
      };

      if (postType === "poll") {
        body.poll = {
          options: pollOptions.filter((opt) => opt.trim()),
          multipleChoice: pollMultipleChoice,
          endsAt: pollEndsAt || null,
        };
      }

      const res = await fetch("/api/board/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/board/${data.data.id}`);
      } else {
        alert(data.error || "게시물 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Post create error:", error);
      alert("게시물 작성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/board" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          게시판으로 돌아가기
        </Link>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">새 게시물 작성</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="postType">게시물 유형</Label>
            <Select
              value={postType}
              onValueChange={(v) =>
                setPostType(v as "general" | "gallery" | "poll")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">일반 게시물</SelectItem>
                <SelectItem value="gallery">갤러리</SelectItem>
                <SelectItem value="poll">투표</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={8}
              required
            />
          </div>

          {/* 갤러리/일반 게시물 이미지 URL 입력 */}
          {(postType === "gallery" || postType === "general") && (
            <div className="space-y-2">
              <Label>이미지 URL</Label>
              <div className="space-y-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...imageUrls];
                        newUrls[i] = e.target.value;
                        setImageUrls(newUrls);
                      }}
                      placeholder="이미지 URL"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setImageUrls(imageUrls.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImageUrls([...imageUrls, ""])}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  이미지 추가
                </Button>
              </div>
            </div>
          )}

          {/* 투표 옵션 */}
          {postType === "poll" && (
            <div className="space-y-4 p-4 border rounded-lg">
              <Label>투표 옵션</Label>
              <div className="space-y-2">
                {pollOptions.map((option, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handlePollOptionChange(i, e.target.value)}
                      placeholder={`옵션 ${i + 1}`}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemovePollOption(i)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPollOption}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    옵션 추가
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="multipleChoice"
                  checked={pollMultipleChoice}
                  onCheckedChange={(checked) =>
                    setPollMultipleChoice(!!checked)
                  }
                />
                <Label htmlFor="multipleChoice" className="font-normal">
                  복수 선택 허용
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endsAt">마감 일시 (선택)</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={pollEndsAt}
                  onChange={(e) => setPollEndsAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              게시하기
            </Button>
            <Link href="/board">
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

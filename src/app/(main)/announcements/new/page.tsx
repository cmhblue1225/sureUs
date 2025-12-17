"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, Upload, X, FileIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"notice" | "training" | "event">(
    "notice"
  );
  const [isImportant, setIsImportant] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/profile/me");
        const data = await res.json();
        if (data.success && data.data.role === "admin") {
          setIsAdmin(true);
        } else {
          router.push("/announcements");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/announcements");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAdmin();
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const supabase = createClient();

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("announcement-files")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert(`파일 업로드 실패: ${file.name}`);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("announcement-files").getPublicUrl(filePath);

        setFiles((prev) => [
          ...prev,
          {
            name: file.name,
            url: publicUrl,
            size: file.size,
            type: file.type,
          },
        ]);
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          isImportant,
          isPinned,
          files,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/announcements/${data.data.id}`);
      } else {
        alert(data.error || "공지 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Create announcement error:", error);
      alert("공지 작성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
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
          href="/announcements"
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          공지사항으로 돌아가기
        </Link>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">새 공지 작성</h1>

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

          {/* 파일 업로드 */}
          <div className="space-y-2">
            <Label>첨부파일</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploading
                    ? "업로드 중..."
                    : "클릭하여 파일을 선택하세요 (최대 50MB)"}
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-accent/50 rounded"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              공지 등록
            </Button>
            <Link href="/announcements">
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, X, Globe, Lock } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "스포츠", label: "스포츠", description: "러닝, 축구, 농구, 테니스 등" },
  { value: "취미", label: "취미", description: "게임, 보드게임, 캠핑 등" },
  { value: "자기개발", label: "자기개발", description: "독서, 영어, 자격증 등" },
  { value: "기술/IT", label: "기술/IT", description: "코딩, AI, 사이드프로젝트 등" },
  { value: "소셜", label: "소셜", description: "맛집, 커피, 와인 등" },
  { value: "문화/예술", label: "문화/예술", description: "영화, 음악, 미술 등" },
  { value: "기타", label: "기타", description: "기타 관심사" },
];

const SUGGESTED_TAGS = [
  "러닝", "헬스", "축구", "농구", "테니스", "골프", "등산", "캠핑",
  "독서", "영어", "일본어", "자격증", "투자", "부동산",
  "코딩", "사이드프로젝트", "AI", "블록체인",
  "맛집", "커피", "와인", "요리", "베이킹",
  "영화", "음악", "사진", "그림", "글쓰기",
  "게임", "보드게임", "여행",
];

export default function CreateClubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [joinPolicy, setJoinPolicy] = useState("public");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < 10) {
      setTags([...tags, normalizedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("동호회 이름을 입력해주세요.");
      return;
    }

    if (!category) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          joinPolicy,
          tags,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/clubs/${data.data.id}`);
      } else {
        setError(data.error || "동호회 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Create club error:", error);
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/clubs">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">동호회 만들기</h1>
          <p className="text-muted-foreground">
            새로운 동호회를 만들어 동료들과 함께하세요
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>동호회의 기본 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">동호회 이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 개발팀 러닝 동호회"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50자
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>카테고리 *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div>{cat.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {cat.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="동호회에 대해 간단히 소개해주세요"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500자
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>관심사 태그</CardTitle>
            <CardDescription>
              동호회와 관련된 태그를 추가하세요 (최대 10개)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tag Input */}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                maxLength={20}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim() || tags.length >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">추천 태그</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.filter(tag => !tags.includes(tag))
                  .slice(0, 15)
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleAddTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Join Policy */}
        <Card>
          <CardHeader>
            <CardTitle>가입 정책</CardTitle>
            <CardDescription>
              동호회 가입 방식을 선택하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  joinPolicy === "public"
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground"
                }`}
                onClick={() => setJoinPolicy("public")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    joinPolicy === "public" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">공개</h4>
                    <p className="text-sm text-muted-foreground">
                      누구나 자유롭게 가입
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  joinPolicy === "approval"
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground"
                }`}
                onClick={() => setJoinPolicy("approval")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    joinPolicy === "approval" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">승인제</h4>
                    <p className="text-sm text-muted-foreground">
                      회장 승인 후 가입
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/clubs">취소</Link>
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            동호회 만들기
          </Button>
        </div>
      </form>
    </div>
  );
}

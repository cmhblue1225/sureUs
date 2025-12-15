"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ClubInfo {
  id: string;
  name: string;
  isLeader: boolean;
  isMember: boolean;
}

interface PollOption {
  id: number;
  text: string;
}

export default function NewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [club, setClub] = useState<ClubInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [postType, setPostType] = useState<string>("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Poll specific state
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: 1, text: "" },
    { id: 2, text: "" },
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchClubInfo();
  }, [resolvedParams.id]);

  const fetchClubInfo = async () => {
    try {
      const response = await fetch(`/api/clubs/${resolvedParams.id}`);
      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error || "동호회를 불러올 수 없습니다.",
          variant: "destructive",
        });
        router.push("/clubs");
        return;
      }

      if (!result.data.isMember) {
        toast({
          title: "접근 제한",
          description: "동호회 회원만 글을 작성할 수 있습니다.",
          variant: "destructive",
        });
        router.push(`/clubs/${resolvedParams.id}`);
        return;
      }

      setClub(result.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "오류",
        description: "동호회 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addPollOption = () => {
    if (pollOptions.length >= 10) {
      toast({
        title: "제한",
        description: "투표 옵션은 최대 10개까지 추가할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    const maxId = Math.max(...pollOptions.map((o) => o.id));
    setPollOptions([...pollOptions, { id: maxId + 1, text: "" }]);
  };

  const removePollOption = (id: number) => {
    if (pollOptions.length <= 2) {
      toast({
        title: "제한",
        description: "최소 2개의 옵션이 필요합니다.",
        variant: "destructive",
      });
      return;
    }
    setPollOptions(pollOptions.filter((o) => o.id !== id));
  };

  const updatePollOption = (id: number, text: string) => {
    setPollOptions(
      pollOptions.map((o) => (o.id === id ? { ...o, text } : o))
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }

    if (postType === "poll") {
      if (!pollQuestion.trim()) {
        toast({
          title: "입력 오류",
          description: "투표 질문을 입력해주세요.",
          variant: "destructive",
        });
        return false;
      }

      const validOptions = pollOptions.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        toast({
          title: "입력 오류",
          description: "최소 2개의 투표 옵션을 입력해주세요.",
          variant: "destructive",
        });
        return false;
      }

      if (hasEndDate && !endDate) {
        toast({
          title: "입력 오류",
          description: "마감 일시를 설정해주세요.",
          variant: "destructive",
        });
        return false;
      }

      if (hasEndDate && new Date(endDate) <= new Date()) {
        toast({
          title: "입력 오류",
          description: "마감 일시는 현재 시간 이후여야 합니다.",
          variant: "destructive",
        });
        return false;
      }
    } else {
      if (!content.trim()) {
        toast({
          title: "입력 오류",
          description: "내용을 입력해주세요.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postData: any = {
        type: postType,
        title: title.trim(),
        content: postType === "poll" ? pollQuestion.trim() : content.trim(),
      };

      if (postType === "poll") {
        postData.pollData = {
          question: pollQuestion.trim(),
          options: pollOptions
            .filter((o) => o.text.trim())
            .map((o) => o.text.trim()),
          allowMultiple: allowMultiple,
          endDate: hasEndDate ? new Date(endDate).toISOString() : null,
        };
      }

      const response = await fetch(`/api/clubs/${resolvedParams.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          title: "오류",
          description: result.error || "게시물 작성에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "성공",
        description: "게시물이 작성되었습니다.",
      });

      router.push(`/clubs/${resolvedParams.id}/posts`);
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "오류",
        description: "게시물 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum datetime for end date (current time)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">글쓰기</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{club.name} 게시판</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="postType">게시물 유형</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue placeholder="게시물 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">일반 게시물</SelectItem>
                  {club.isLeader && (
                    <SelectItem value="announcement">공지사항</SelectItem>
                  )}
                  <SelectItem value="poll">투표</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={100}
              />
            </div>

            {/* Content or Poll Options */}
            {postType === "poll" ? (
              <>
                {/* Poll Question */}
                <div className="space-y-2">
                  <Label htmlFor="pollQuestion">투표 질문</Label>
                  <Input
                    id="pollQuestion"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="투표 질문을 입력하세요"
                    maxLength={200}
                  />
                </div>

                {/* Poll Options */}
                <div className="space-y-3">
                  <Label>투표 옵션 (최소 2개, 최대 10개)</Label>
                  {pollOptions.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <Input
                        value={option.text}
                        onChange={(e) =>
                          updatePollOption(option.id, e.target.value)
                        }
                        placeholder={`옵션 ${index + 1}`}
                        maxLength={100}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePollOption(option.id)}
                        disabled={pollOptions.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
                    disabled={pollOptions.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    옵션 추가
                  </Button>
                </div>

                {/* Poll Settings */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">투표 설정</h4>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowMultiple"
                      checked={allowMultiple}
                      onCheckedChange={(checked) =>
                        setAllowMultiple(!!checked)
                      }
                    />
                    <Label htmlFor="allowMultiple" className="cursor-pointer">
                      복수 선택 허용
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasEndDate"
                        checked={hasEndDate}
                        onCheckedChange={(checked) =>
                          setHasEndDate(!!checked)
                        }
                      />
                      <Label htmlFor="hasEndDate" className="cursor-pointer">
                        마감 일시 설정
                      </Label>
                    </div>
                    {hasEndDate && (
                      <Input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={getMinDateTime()}
                        className="max-w-xs"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Regular Content */
              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={10}
                />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    작성 중...
                  </>
                ) : (
                  "게시하기"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

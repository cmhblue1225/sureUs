"use client";

/**
 * TeamGroupingPanel Component
 *
 * 관리자용 조 편성 패널
 * - 자연어 기준 입력
 * - AI 기반 팀 생성
 * - 결과 공유 (공지/메시지)
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Loader2,
  Sparkles,
  Users,
  Megaphone,
  MessageSquare,
  History,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type {
  TeamGroupingResult,
  GeneratedTeam,
  GroupingCriteria,
  TeamGroupingHistoryItem,
} from "@/lib/team-grouping/types";
import { criteriaToKorean } from "@/lib/team-grouping/criteriaParser";

interface TeamGroupingPanelProps {
  memberCount: number;
}

export function TeamGroupingPanel({ memberCount }: TeamGroupingPanelProps) {
  // 입력 상태
  const [criteriaText, setCriteriaText] = useState("");
  const [teamSize, setTeamSize] = useState(4);

  // 처리 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // 결과 상태
  const [result, setResult] = useState<TeamGroupingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 다이얼로그 상태
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<"announcement" | "messages" | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("조 편성 결과 안내");
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // 이력 상태
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<TeamGroupingHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 조 편성 생성
  const handleGenerate = useCallback(async () => {
    if (!criteriaText.trim()) {
      setError("조 편성 기준을 입력해주세요.");
      return;
    }

    if (teamSize < 2 || teamSize > 20) {
      setError("팀 인원은 2-20명 사이로 설정해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/team-grouping/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteriaText, teamSize }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "조 편성에 실패했습니다.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      setError("조 편성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }, [criteriaText, teamSize]);

  // 결과 공유
  const handleShare = useCallback(async () => {
    if (!result?.id || !shareType) return;

    setIsSharing(true);
    setShareSuccess(null);

    try {
      const response = await fetch("/api/team-grouping/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupingId: result.id,
          shareType,
          announcementTitle: shareType === "announcement" ? announcementTitle : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareSuccess(
          shareType === "announcement"
            ? "공지사항이 등록되었습니다."
            : `${data.data.messageCount}명에게 메시지를 전송했습니다.`
        );
        setShareDialogOpen(false);
      } else {
        setError(data.error || "공유에 실패했습니다.");
      }
    } catch (err) {
      console.error("Share error:", err);
      setError("공유 중 오류가 발생했습니다.");
    } finally {
      setIsSharing(false);
    }
  }, [result, shareType, announcementTitle]);

  // 이력 불러오기
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/team-grouping/history?limit=10");
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error("History error:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // 공유 다이얼로그 열기
  const openShareDialog = (type: "announcement" | "messages") => {
    setShareType(type);
    setShareDialogOpen(true);
  };

  // 이력 다이얼로그 열기
  const openHistoryDialog = () => {
    setHistoryOpen(true);
    loadHistory();
  };

  return (
    <div className="space-y-6">
      {/* 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            조 편성 기준
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="criteria">편성 기준 (자연어 입력)</Label>
            <Textarea
              id="criteria"
              placeholder="예: 부서가 다양하게 구성되고, MBTI가 비슷한 사람들끼리 배치해주세요"
              value={criteriaText}
              onChange={(e) => setCriteriaText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              AI가 입력한 기준을 분석하여 최적의 조를 편성합니다.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamSize">조당 인원</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="teamSize"
                  type="number"
                  min={2}
                  max={20}
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value) || 2)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">명</span>
              </div>
            </div>

            <div className="flex-1 text-right">
              <p className="text-sm text-muted-foreground mb-1">
                전체 인원: {memberCount}명 / 예상 조 수: {Math.floor(memberCount / teamSize)}개
              </p>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !criteriaText.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI가 조 편성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                조 편성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 에러 표시 */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 성공 메시지 */}
      {shareSuccess && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>{shareSuccess}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결과 섹션 */}
      {result && (
        <>
          {/* AI 분석 결과 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">AI 분석 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {criteriaToKorean(result.criteriaParsed).map((desc, i) => (
                  <Badge key={i} variant="secondary">
                    {desc}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                신뢰도: {Math.round(result.criteriaParsed.confidence * 100)}%
              </p>
            </CardContent>
          </Card>

          {/* 통계 */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{result.teamCount}</p>
                  <p className="text-xs text-muted-foreground">조</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{result.teamSize}</p>
                  <p className="text-xs text-muted-foreground">조당 인원</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {result.teams.reduce((sum, t) => sum + t.members.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">총 배정 인원</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 팀 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.teams.map((team) => (
              <TeamCard key={team.teamIndex} team={team} />
            ))}
          </div>

          {/* 미배정 멤버 */}
          {result.ungroupedMembers.length > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 dark:text-amber-400">
                  미배정 인원 ({result.ungroupedMembers.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.ungroupedMembers.map((member) => (
                    <Badge key={member.id} variant="outline">
                      {member.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 공유 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => openShareDialog("announcement")}
              disabled={!result.id}
            >
              <Megaphone className="h-4 w-4 mr-2" />
              공지로 공유
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => openShareDialog("messages")}
              disabled={!result.id}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              개별 메시지 전송
            </Button>
          </div>
        </>
      )}

      {/* 이력 버튼 */}
      <Button variant="ghost" className="w-full" onClick={openHistoryDialog}>
        <History className="h-4 w-4 mr-2" />
        이전 편성 기록
      </Button>

      {/* 공유 다이얼로그 */}
      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {shareType === "announcement" ? "공지사항으로 공유" : "개별 메시지 전송"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {shareType === "announcement"
                ? "조 편성 결과를 공지사항으로 등록합니다."
                : "각 팀원에게 본인의 조 정보가 담긴 메시지를 전송합니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {shareType === "announcement" && (
            <div className="space-y-2 py-4">
              <Label htmlFor="title">공지 제목</Label>
              <Input
                id="title"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSharing}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleShare} disabled={isSharing}>
              {isSharing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  공유 중...
                </>
              ) : (
                "공유하기"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 이력 다이얼로그 */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>이전 편성 기록</DialogTitle>
            <DialogDescription>최근 조 편성 이력을 확인합니다.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>편성 기록이 없습니다.</p>
              </div>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.criteriaText}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.teamCount}개 조 / {item.teamSize}명씩
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                      {item.sharedVia && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.sharedVia === "announcement" ? "공지" : "메시지"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 팀 카드 컴포넌트
function TeamCard({ team }: { team: GeneratedTeam }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {team.teamName}
          </span>
          <Badge variant="outline" className="text-xs">
            {team.members.length}명
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.name}</p>
                {member.department && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {member.department}
                  </p>
                )}
              </div>
              {member.mbti && (
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {member.mbti}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* 다양성 지표 */}
        <div className="mt-3 pt-3 border-t flex gap-2 text-xs text-muted-foreground">
          <span>부서 {team.diversity.departmentCount}개</span>
          <span>MBTI {team.diversity.mbtiCount}종</span>
          <span>지역 {team.diversity.locationCount}곳</span>
        </div>
      </CardContent>
    </Card>
  );
}

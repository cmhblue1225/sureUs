"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Loader2, RefreshCw, Sparkles, MessageCircle } from "lucide-react";
import type { MatchRecommendation } from "@/types/match";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    generatedAt: string;
    nextRefreshAt: string;
    totalCandidates: number;
  } | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/match/recommendations?limit=12");
      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setRecommendations(data.data.recommendations);
      setMeta(data.data.meta);
    } catch (err) {
      setError("추천을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">추천 동료</h1>
          <p className="text-muted-foreground mt-1">
            나와 비슷한 관심사와 업무 스타일을 가진 동료를 발견하세요
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            {error.includes("프로필") && (
              <Link href="/profile/edit">
                <Button>프로필 작성하기</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">추천 동료</h1>
          <p className="text-muted-foreground mt-1">
            나와 비슷한 관심사와 업무 스타일을 가진 동료입니다
          </p>
        </div>
        <Button variant="outline" onClick={fetchRecommendations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {meta && (
        <p className="text-sm text-muted-foreground">
          {meta.totalCandidates}명의 동료 중 추천 결과입니다
        </p>
      )}

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">아직 추천할 동료가 없습니다</h3>
            <p className="text-sm text-muted-foreground mt-1">
              더 많은 동료들이 프로필을 작성하면 추천이 시작됩니다
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <Card key={rec.user.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {rec.user.avatarUrl ? (
                      <img
                        src={rec.user.avatarUrl}
                        alt={rec.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{rec.user.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {rec.user.department} · {rec.user.jobRole}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Summary - No "compatibility score" language */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium">{rec.match.explanation?.summary || "좋은 네트워킹 기회입니다"}</p>
                </div>

                {/* Highlights */}
                {rec.match.explanation?.highlights && rec.match.explanation.highlights.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">매칭 포인트</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.match.explanation.highlights.slice(0, 3).map((highlight, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match Details */}
                {rec.match.explanation?.details && rec.match.explanation.details.length > 0 && (
                  <div className="space-y-2">
                    {rec.match.explanation.details.slice(0, 2).map((detail, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        • {detail.label}: {detail.value}
                      </div>
                    ))}
                  </div>
                )}

                {/* Conversation Starters */}
                {rec.match.conversationStarters && rec.match.conversationStarters.length > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <MessageCircle className="h-3 w-3" />
                      대화 주제
                    </div>
                    <p className="text-sm">
                      {rec.match.conversationStarters[0]}
                    </p>
                  </div>
                )}

                {/* Hobbies */}
                {rec.user.hobbies && rec.user.hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rec.user.hobbies.slice(0, 4).map((hobby) => (
                      <Badge key={hobby} variant="outline" className="text-xs">
                        {hobby}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action */}
                <Link href={`/profile/${rec.user.id}`}>
                  <Button variant="outline" className="w-full mt-2">
                    프로필 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Sparkles, ChevronRight, Star } from "lucide-react";

interface ClubRecommendation {
  club: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    image_url: string | null;
    member_count: number;
    tags: string[];
  };
  score: number;
  reasons: string[];
  breakdown: {
    tagMatch: number;
    socialGraph: number;
    memberComposition: number;
    activityLevel: number;
    categoryPreference: number;
  };
}

interface ClubRecommendationsProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export default function ClubRecommendations({
  limit = 5,
  showHeader = true,
  compact = false,
}: ClubRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ClubRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/clubs/recommendations?limit=${limit}&excludeJoined=true`
      );
      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.clubs);
      }
    } catch (error) {
      console.error("Recommendations fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreStars = (score: number) => {
    const stars = Math.round(score * 5);
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
          }`}
        />
      ));
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              추천 동호회
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              추천 동호회
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>아직 추천할 동호회가 없습니다.</p>
            <Link href="/clubs">
              <Button variant="link" className="mt-2">
                동호회 둘러보기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            추천 동호회
          </CardTitle>
          <Link href="/clubs">
            <Button variant="ghost" size="sm">
              전체 보기
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <Link
            key={rec.club.id}
            href={`/clubs/${rec.club.id}`}
            className="block"
          >
            <div className="flex gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
              {/* Club Image */}
              {!compact && (
                <div className="flex-shrink-0">
                  {rec.club.image_url ? (
                    <img
                      src={rec.club.image_url}
                      alt={rec.club.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  )}
                </div>
              )}

              {/* Club Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium truncate">{rec.club.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {rec.club.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Users className="h-3 w-3 inline mr-1" />
                        {rec.club.member_count}명
                      </span>
                    </div>
                  </div>
                  {!compact && (
                    <div className="flex items-center gap-0.5">
                      {getScoreStars(rec.score)}
                    </div>
                  )}
                </div>

                {/* Reasons */}
                {!compact && rec.reasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rec.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {compact && rec.reasons.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {rec.reasons[0]}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

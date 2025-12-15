"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock, Globe, Crown } from "lucide-react";

interface ClubCardProps {
  club: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    image_url: string | null;
    join_policy: string;
    member_count: number;
    tags: string[];
    leader: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
    isMember?: boolean;
    isLeader?: boolean;
    hasPendingRequest?: boolean;
  };
  onJoin?: (clubId: string) => void;
}

export function ClubCard({ club, onJoin }: ClubCardProps) {
  const categoryColors: Record<string, string> = {
    "스포츠": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    "취미": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "자기개발": "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "기술/IT": "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    "소셜": "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    "문화/예술": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    "기타": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Card className="hover:border-primary/50 transition-colors overflow-hidden">
      <Link href={`/clubs/${club.id}`}>
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
          {club.image_url ? (
            <img
              src={club.image_url}
              alt={club.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-12 h-12 text-primary/30" />
            </div>
          )}
          {/* Join Policy Badge */}
          <div className="absolute top-2 right-2">
            {club.join_policy === "approval" ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                승인제
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 bg-background/80">
                <Globe className="w-3 h-3" />
                공개
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Category & Name */}
          <div>
            <Badge className={categoryColors[club.category] || categoryColors["기타"]} variant="secondary">
              {club.category}
            </Badge>
            <Link href={`/clubs/${club.id}`}>
              <h3 className="font-semibold text-lg mt-2 hover:text-primary transition-colors line-clamp-1">
                {club.name}
              </h3>
            </Link>
          </div>

          {/* Description */}
          {club.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {club.description}
            </p>
          )}

          {/* Tags */}
          {club.tags && club.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {club.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {club.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{club.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{club.member_count}명</span>
              {club.isLeader && (
                <Badge variant="default" className="gap-1 ml-1">
                  <Crown className="w-3 h-3" />
                  회장
                </Badge>
              )}
            </div>

            {/* Join Button */}
            {!club.isMember && !club.isLeader && (
              club.hasPendingRequest ? (
                <Button variant="outline" size="sm" disabled>
                  승인 대기 중
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    onJoin?.(club.id);
                  }}
                >
                  {club.join_policy === "approval" ? "가입 신청" : "가입하기"}
                </Button>
              )
            )}

            {club.isMember && !club.isLeader && (
              <Badge variant="secondary">회원</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

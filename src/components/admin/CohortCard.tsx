"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, LogIn, Trash2, Settings } from "lucide-react";
import Link from "next/link";

interface CohortCardProps {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  isSelecting?: boolean;
}

export function CohortCard({
  id,
  name,
  description,
  userCount,
  isActive,
  onSelect,
  onDelete,
  isSelecting,
}: CohortCardProps) {
  return (
    <Card className={!isActive ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {name}
            {!isActive && (
              <Badge variant="secondary" className="text-xs">
                비활성
              </Badge>
            )}
          </CardTitle>
          <Link href={`/admin/cohorts/${id}`}>
            <Button variant="ghost" size="icon" title="기수 관리">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{userCount}명</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(id)}
              disabled={!isActive || isSelecting}
            >
              <LogIn className="w-4 h-4 mr-1" />
              선택
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id, name)}
              disabled={userCount > 0}
              className="text-destructive hover:text-destructive"
              title={userCount > 0 ? "사용자가 있어 삭제할 수 없습니다" : "삭제"}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CohortCard;

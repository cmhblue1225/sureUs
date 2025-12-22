"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MessageCircle, MapPin, Briefcase, Building2 } from "lucide-react";
import type { ClusteredNode } from "@/lib/graph/clustering";

interface ProfileModalProps {
  node: ClusteredNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ node, open, onOpenChange }: ProfileModalProps) {
  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{node.name} 프로필</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <UserAvatar src={node.avatarUrl} alt={node.name} size="xl" className="mb-4" />

          {/* Name & MBTI */}
          <h2 className="text-xl font-bold">{node.name}</h2>
          {node.mbti && (
            <Badge variant="secondary" className="mt-2 font-mono">
              {node.mbti}
            </Badge>
          )}
        </div>

        <Separator className="my-4" />

        {/* Info Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">부서:</span>
            <span className="font-medium">{node.department}</span>
          </div>

          {node.jobRole && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">직무:</span>
              <span className="font-medium">{node.jobRole}</span>
            </div>
          )}

          {node.officeLocation && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">위치:</span>
              <span className="font-medium">{node.officeLocation}</span>
            </div>
          )}
        </div>

        {/* Hobbies */}
        {node.hobbies && node.hobbies.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-sm text-muted-foreground mb-2">관심사</p>
              <div className="flex flex-wrap gap-2">
                {node.hobbies.map((hobby) => (
                  <Badge key={hobby} variant="outline">
                    {hobby}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {!node.isCurrentUser && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-3">
              <Link href={`/profile/${node.userId}`} className="flex-1">
                <Button className="w-full" variant="outline">
                  프로필 보기
                </Button>
              </Link>
              <Link href={`/messages?to=${node.userId}`} className="flex-1">
                <Button className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  메시지
                </Button>
              </Link>
            </div>
          </>
        )}

        {node.isCurrentUser && (
          <>
            <Separator className="my-4" />
            <Link href="/profile/edit">
              <Button className="w-full" variant="outline">
                내 프로필 수정
              </Button>
            </Link>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

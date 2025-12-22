'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileModal } from '@/components/graph/ProfileModal';
import { RecognitionResult, TrackedFace } from '@/lib/face-recognition/types';
import { User } from 'lucide-react';
import type { ClusteredNode } from '@/lib/graph/clustering';

interface ProfileDetailPanelProps {
  face: TrackedFace | null;
  result: RecognitionResult | null;
  pending: boolean;
}

export function ProfileDetailPanel({
  face,
  result,
  pending
}: ProfileDetailPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!face) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">프로필 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            프로필 카드를 선택하면 상세 정보가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const recognized = result?.recognized;
  const profile = result?.profile;
  const statusLabel = pending
    ? '스캔 중'
    : recognized
      ? '등록됨'
      : '미등록';

  // Convert recognition result to ClusteredNode format for ProfileModal
  const clusteredNode: ClusteredNode | null = recognized && result?.user_id && profile
    ? {
        id: result.user_id,
        userId: result.user_id,
        name: profile.name,
        department: profile.department,
        jobRole: profile.job_role,
        officeLocation: profile.office_location,
        mbti: profile.mbti,
        avatarUrl: undefined, // Will be loaded in modal if needed
        hobbies: [],
        isCurrentUser: false,
        clusterId: '',
        position: { x: 0, y: 0 },
      }
    : null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">프로필 상세</CardTitle>
            <p className="text-xs text-muted-foreground">Track ID: {face.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {recognized && clusteredNode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
              >
                <User className="w-4 h-4 mr-2" />
                프로필 보기
              </Button>
            )}
            <Badge variant={recognized ? 'default' : 'secondary'}>{statusLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">이름</p>
            <p className="text-sm font-semibold">{profile?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">이메일</p>
            <p className="text-sm font-semibold">{profile?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">부서</p>
            <p className="text-sm font-semibold">{profile?.department || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">직무</p>
            <p className="text-sm font-semibold">{profile?.job_role || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">근무지</p>
            <p className="text-sm font-semibold">{profile?.office_location || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">MBTI</p>
            <p className="text-sm font-semibold">{profile?.mbti || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">신뢰도</p>
            <p className="text-sm font-semibold">
              {result?.confidence != null ? `${(result.confidence * 100).toFixed(1)}%` : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">지연 시간</p>
            <p className="text-sm font-semibold">
              {result?.latency_ms != null ? `${result.latency_ms}ms` : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Modal */}
      <ProfileModal
        node={clusteredNode}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

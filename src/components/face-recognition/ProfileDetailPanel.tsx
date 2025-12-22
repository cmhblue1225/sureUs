'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecognitionResult, TrackedFace } from '@/lib/face-recognition/types';

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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">프로필 상세</CardTitle>
          <p className="text-xs text-muted-foreground">Track ID: {face.id}</p>
        </div>
        <Badge variant={recognized ? 'default' : 'secondary'}>{statusLabel}</Badge>
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
  );
}

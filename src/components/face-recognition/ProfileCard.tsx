'use client';

import { Badge } from '@/components/ui/badge';

type CardStatus = 'registered' | 'unregistered' | 'scanning' | 'unknown';

const STATUS_LABEL: Record<CardStatus, string> = {
  registered: '등록됨',
  unregistered: '미등록',
  scanning: '스캔 중',
  unknown: '알 수 없음'
};

const STATUS_CLASS: Record<CardStatus, string> = {
  registered: 'bg-emerald-500 text-white border-emerald-500',
  unregistered: 'bg-amber-500 text-white border-amber-500',
  scanning: 'bg-slate-700 text-white border-slate-700',
  unknown: 'bg-slate-500 text-white border-slate-500'
};

interface ProfileCardProps {
  name: string;
  meta: string;
  status: CardStatus;
  selected?: boolean;
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/);
  if (!parts.length) return '?';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function ProfileCard({
  name,
  meta,
  status,
  selected
}: ProfileCardProps) {
  const initials = getInitials(name || 'Unknown');

  return (
    <div
      className={[
        'rounded-2xl border bg-card/90 px-3 py-2 shadow-md backdrop-blur-sm',
        'text-foreground',
        selected ? 'ring-2 ring-emerald-400 border-emerald-200' : 'border-border'
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Badge className={`border ${STATUS_CLASS[status]}`}>
          {STATUS_LABEL[status]}
        </Badge>
      </div>
    </div>
  );
}

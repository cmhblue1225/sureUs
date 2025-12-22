'use client';

import { useMemo } from 'react';
import {
  FaceDisplayRect,
  RecognitionResult,
  TrackedFace
} from '@/lib/face-recognition/types';
import { ProfileCard } from './ProfileCard';

type ResultsMap = Record<string, RecognitionResult>;

interface FaceOverlayProps {
  faces: TrackedFace[];
  resultsById: ResultsMap;
  pendingIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  displayRect: FaceDisplayRect | null;
  /** 인식된 사용자 클릭 시 프로필 페이지로 이동할지 여부 */
  navigateOnClick?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function FaceOverlay({
  faces,
  resultsById,
  pendingIds,
  selectedId,
  onSelect,
  displayRect,
  navigateOnClick = false
}: FaceOverlayProps) {
  const pendingSet = useMemo(() => new Set(pendingIds), [pendingIds]);

  const handleCardClick = (faceId: string, result: RecognitionResult | undefined) => {
    // 인식된 사용자인 경우 프로필 페이지로 이동
    if (navigateOnClick && result?.recognized && result?.user_id) {
      window.location.href = `/profile/${result.user_id}`;
      return;
    }
    // 아니면 기존 동작 (선택)
    onSelect(faceId);
  };

  if (!displayRect) return null;

  const scaleX = displayRect.width / displayRect.videoWidth;
  const scaleY = displayRect.height / displayRect.videoHeight;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: displayRect.width,
        height: displayRect.height,
        left: displayRect.offsetX,
        top: displayRect.offsetY
      }}
    >
      {faces.map(face => {
        const result = resultsById[face.id];
        const pending = pendingSet.has(face.id);
        const isSelected = selectedId === face.id;

        const status: 'registered' | 'unregistered' | 'scanning' | 'unknown' = pending
          ? 'scanning'
          : result?.recognized
            ? 'registered'
            : result
              ? 'unregistered'
              : 'unknown';

        const name = result?.profile?.name || 'Unknown';
        const meta =
          result?.profile?.department ||
          result?.profile?.email ||
          'No profile data';

        const boxLeft = face.box.x * scaleX;
        const boxTop = face.box.y * scaleY;
        const boxWidth = face.box.width * scaleX;
        const boxHeight = face.box.height * scaleY;

        const cardWidth = 190;
        const cardHeight = 86;
        const padding = 10;

        const placeAbove = boxTop - cardHeight - 12 > 0;
        const cardTop = placeAbove
          ? boxTop - cardHeight - 12
          : Math.min(boxTop + boxHeight + 12, displayRect.height - cardHeight - padding);

        const cardLeft = clamp(
          boxLeft,
          padding,
          displayRect.width - cardWidth - padding
        );

        const pointerSize = 10;
        const pointerLeft = clamp(
          boxLeft + boxWidth * 0.5 - pointerSize / 2,
          cardLeft + 12,
          cardLeft + cardWidth - 12
        );
        const pointerTop = placeAbove
          ? cardTop + cardHeight - pointerSize / 2
          : cardTop - pointerSize / 2;

        return (
          <div key={face.id} className="absolute inset-0">
            <div
              className={[
                'absolute rounded-2xl border-2 transition-all duration-150',
                isSelected ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]' : 'border-white/60'
              ].join(' ')}
              style={{
                left: boxLeft,
                top: boxTop,
                width: boxWidth,
                height: boxHeight
              }}
            />
            <div
              className="absolute h-2.5 w-2.5 rounded-full bg-emerald-400"
              style={{
                left: boxLeft + boxWidth - 6,
                top: boxTop - 6
              }}
            />
            <div
              className="absolute h-2.5 w-2.5 rounded-full bg-emerald-400"
              style={{
                left: boxLeft - 4,
                top: boxTop - 6
              }}
            />

            <div
              className="absolute h-2.5 w-2.5 rotate-45 border border-white/70 bg-white/90 shadow-sm"
              style={{
                left: pointerLeft,
                top: pointerTop
              }}
            />

            <button
              type="button"
              onClick={() => handleCardClick(face.id, result)}
              className="absolute pointer-events-auto transition-all duration-150"
              style={{
                left: cardLeft,
                top: cardTop,
                width: cardWidth
              }}
            >
              <ProfileCard
                name={name}
                meta={meta}
                status={status}
                selected={isSelected}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

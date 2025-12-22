'use client';

import { RefObject, useEffect, useRef, useState, useCallback } from 'react';
import { RecognitionResult, TrackedFace } from '@/lib/face-recognition/types';
import { RECOGNITION_INTERVAL } from '@/lib/face-recognition/config';

type ResultsMap = Record<string, RecognitionResult>;

export interface UseFaceRecognitionOptions {
  onRecognized?: (result: RecognitionResult) => void;
}

function getArea(face: TrackedFace) {
  return face.box.width * face.box.height;
}

async function captureFrame(videoRef: RefObject<HTMLVideoElement | null>) {
  if (!videoRef.current) return null;

  const video = videoRef.current;
  const captureCanvas = document.createElement('canvas');
  captureCanvas.width = video.videoWidth;
  captureCanvas.height = video.videoHeight;

  const ctx = captureCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

  return new Promise<Blob | null>((resolve) => {
    captureCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
  });
}

export function useFaceRecognition(
  videoRef: RefObject<HTMLVideoElement | null>,
  faces: TrackedFace[],
  options?: UseFaceRecognitionOptions
) {
  const [resultsById, setResultsById] = useState<ResultsMap>({});
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const facesRef = useRef<TrackedFace[]>([]);
  const pendingRef = useRef<Set<string>>(new Set());
  const lastSentRef = useRef<Map<string, number>>(new Map());
  const onRecognizedRef = useRef(options?.onRecognized);

  // 콜백 ref 업데이트
  useEffect(() => {
    onRecognizedRef.current = options?.onRecognized;
  }, [options?.onRecognized]);

  useEffect(() => {
    facesRef.current = faces;

    const faceIds = new Set(faces.map(face => face.id));
    setResultsById(prev => {
      const next: ResultsMap = {};
      for (const [key, value] of Object.entries(prev)) {
        if (faceIds.has(key)) {
          next[key] = value;
        }
      }
      return next;
    });

    const nextPending = new Set<string>();
    for (const id of pendingRef.current) {
      if (faceIds.has(id)) {
        nextPending.add(id);
      }
    }
    pendingRef.current = nextPending;
    setPendingIds(Array.from(nextPending));
  }, [faces]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (!videoRef.current) return;

      const candidates = facesRef.current
        .slice()
        .sort((a, b) => getArea(b) - getArea(a));

      if (!candidates.length) return;

      const now = Date.now();
      let target: TrackedFace | null = null;

      for (const face of candidates) {
        const lastSent = lastSentRef.current.get(face.id) || 0;
        if (pendingRef.current.has(face.id)) continue;
        if (now - lastSent < RECOGNITION_INTERVAL) continue;
        target = face;
        break;
      }

      if (!target) return;

      pendingRef.current.add(target.id);
      setPendingIds(Array.from(pendingRef.current));
      lastSentRef.current.set(target.id, now);

      const targetId = target.id;
      const targetBox = target.box;

      try {
        const blob = await captureFrame(videoRef);
        if (!blob) {
          throw new Error('Failed to capture frame');
        }

        const formData = new FormData();
        formData.append('track_id', targetId);
        formData.append('timestamp', Date.now().toString());
        formData.append('image', blob, 'capture.jpg');
        formData.append('bbox', JSON.stringify([
          targetBox.x,
          targetBox.y,
          targetBox.width,
          targetBox.height
        ]));

        const response = await fetch('/api/face-recognition/recognize', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Recognition request failed');
        }

        const rawData = await response.json();
        console.log('[useFaceRecognition] Raw API Response:', JSON.stringify(rawData));

        // FastAPI가 external_key를 반환할 수 있으므로 user_id로 매핑
        const data: RecognitionResult = {
          ...rawData,
          user_id: rawData.user_id || rawData.external_key || null,
        };
        console.log('[useFaceRecognition] recognized:', data.recognized, 'user_id:', data.user_id);

        setResultsById(prev => ({
          ...prev,
          [targetId]: data
        }));

        // 인식 성공 시 콜백 호출
        if (data.recognized && data.user_id) {
          console.log('[useFaceRecognition] Calling onRecognized callback');
          if (onRecognizedRef.current) {
            onRecognizedRef.current(data);
          } else {
            console.log('[useFaceRecognition] onRecognizedRef.current is null/undefined');
          }
        }

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Recognition failed: ' + errorMessage);
      } finally {
        pendingRef.current.delete(targetId);
        setPendingIds(Array.from(pendingRef.current));
      }
    }, RECOGNITION_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [videoRef]);

  return {
    resultsById,
    pendingIds,
    error
  };
}

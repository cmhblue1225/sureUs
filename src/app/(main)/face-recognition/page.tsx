'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaPipe } from '@/lib/face-recognition/hooks/useMediaPipe';
import { useFaceRecognition } from '@/lib/face-recognition/hooks/useFaceRecognition';
import { FaceOverlay } from '@/components/face-recognition/FaceOverlay';
import { ProfileDetailPanel } from '@/components/face-recognition/ProfileDetailPanel';
import { Camera, Settings, Video } from 'lucide-react';
import type { RecognitionResult } from '@/lib/face-recognition/types';

export default function FaceRecognitionPage() {
  const router = useRouter();
  const navigatedRef = useRef<boolean>(false); // 이미 이동했는지 추적

  const {
    videoRef,
    canvasRef,
    faceCount,
    facingMode,
    switchCamera,
    trackedFaces,
    displayRect,
    isLoading,
    error: mediaError
  } = useMediaPipe();

  // 인식 성공 시 즉시 프로필 페이지로 이동
  const handleRecognized = useCallback((result: RecognitionResult) => {
    if (navigatedRef.current) return; // 이미 이동했으면 무시
    if (result.recognized && result.user_id) {
      navigatedRef.current = true;
      router.push(`/profile/${result.user_id}`);
    }
  }, [router]);

  const { resultsById, pendingIds, error: recogError } = useFaceRecognition(
    videoRef,
    trackedFaces,
    { onRecognized: handleRecognized }
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!trackedFaces.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !trackedFaces.some(face => face.id === selectedId)) {
      setSelectedId(trackedFaces[0].id);
    }
  }, [trackedFaces, selectedId]);

  const selectedFace = trackedFaces.find(face => face.id === selectedId) || null;
  const selectedResult = selectedFace ? resultsById[selectedFace.id] : null;
  const isRecognizing = pendingIds.length > 0;
  const isSelectedPending = selectedFace ? pendingIds.includes(selectedFace.id) : false;

  const combinedError = mediaError || recogError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">슈아유?</h1>
          <p className="text-sm text-muted-foreground">
            얼굴을 카메라에 비추면 자동으로 인식합니다 (1초마다)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/face-recognition/manage">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              얼굴 등록 관리
            </Button>
          </Link>
          <Link href="/face-recognition/live">
            <Button variant="outline" size="sm">
              <Video className="w-4 h-4 mr-2" />
              라이브 스트림
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {combinedError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive">
          {combinedError}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">MediaPipe 로딩 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Camera View */}
          <div className="relative w-full h-[calc(100vh-22rem)] bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              muted
            />

            <canvas
              ref={canvasRef}
              className="absolute pointer-events-none"
            />

            <FaceOverlay
              faces={trackedFaces}
              resultsById={resultsById}
              pendingIds={pendingIds}
              selectedId={selectedId}
              onSelect={setSelectedId}
              displayRect={displayRect}
            />

            {/* Top overlay - Status */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-white font-medium">실시간 자동 인식</span>
                  </div>
                  <div className="h-4 w-px bg-white/30"></div>
                  <div className="text-white">
                    <span className="text-sm">얼굴 감지:</span>
                    <span className="text-lg font-bold ml-2">{faceCount}</span>
                  </div>
                </div>
                {isRecognizing && (
                  <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm text-white">인식 중...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom overlay - Camera switch */}
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={switchCamera}
                variant="secondary"
                size="default"
                className="backdrop-blur-sm bg-white/20 hover:bg-white/30 text-white border-white/20"
                title={facingMode === 'user' ? '후면 카메라로 전환' : '전면 카메라로 전환'}
              >
                <Camera className="w-4 h-4 mr-2" />
                카메라 전환
              </Button>
            </div>
          </div>

          {/* Profile Details */}
          <ProfileDetailPanel
            face={selectedFace}
            result={selectedResult}
            pending={isSelectedPending}
          />

          {/* Info */}
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 얼굴이 감지되면 프로필 카드가 표시됩니다</li>
                <li>• 초록색 표시: 인식에 성공했습니다</li>
                <li>• 1초마다 자동으로 인식합니다</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

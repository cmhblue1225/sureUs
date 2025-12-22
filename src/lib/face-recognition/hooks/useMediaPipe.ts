'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetector, FilesetResolver, Detection } from '@mediapipe/tasks-vision';
import { MIN_DETECTION_CONFIDENCE } from '@/lib/face-recognition/config';
import {
  FaceDetectionBox,
  FaceDisplayRect,
  TrackedFace
} from '@/lib/face-recognition/types';

export function useMediaPipe() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faceCount, setFaceCount] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [displayRect, setDisplayRect] = useState<FaceDisplayRect | null>(null);
  const [trackedFaces, setTrackedFaces] = useState<TrackedFace[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const trackedFacesRef = useRef<TrackedFace[]>([]);
  const nextTrackIdRef = useRef(1);
  const lastClientSizeRef = useRef({
    width: 0,
    height: 0,
    videoWidth: 0,
    videoHeight: 0
  });

  // Initialize MediaPipe
  useEffect(() => {
    initMediaPipe();

    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Start camera when detector ready or facingMode changes
  useEffect(() => {
    if (faceDetector) {
      startCamera();
    }
  }, [faceDetector, facingMode]);

  async function initMediaPipe() {
    try {
      setIsLoading(true);

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: MIN_DETECTION_CONFIDENCE
      });

      setFaceDetector(detector);
      setIsLoading(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'MediaPipe 초기화 실패';
      setError(errorMessage);
      setIsLoading(false);
    }
  }

  async function startCamera() {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode }
        },
        audio: false
      });

      if (videoRef.current) {
        streamRef.current = stream;
        videoRef.current.muted = true;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            setError('비디오 시작 실패: ' + err.message);
          });

          setTimeout(() => {
            updateCanvasSize();
            detectFaces();
          }, 100);
        };
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '카메라 접근 실패';
      setError('카메라 접근 거부됨: ' + errorMessage);
    }
  }

  function updateCanvasSize() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const videoRatio = video.videoWidth / video.videoHeight;
    const containerRatio = video.clientWidth / video.clientHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (containerRatio > videoRatio) {
      displayHeight = video.clientHeight;
      displayWidth = displayHeight * videoRatio;
      offsetX = (video.clientWidth - displayWidth) / 2;
      offsetY = 0;
    } else {
      displayWidth = video.clientWidth;
      displayHeight = displayWidth / videoRatio;
      offsetX = 0;
      offsetY = (video.clientHeight - displayHeight) / 2;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.style.left = offsetX + 'px';
    canvas.style.top = offsetY + 'px';

    setDisplayRect({
      width: displayWidth,
      height: displayHeight,
      offsetX,
      offsetY,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });
  }

  function computeIoU(a: FaceDetectionBox, b: FaceDetectionBox): number {
    const xA = Math.max(a.x, b.x);
    const yA = Math.max(a.y, b.y);
    const xB = Math.min(a.x + a.width, b.x + b.width);
    const yB = Math.min(a.y + a.height, b.y + b.height);

    const intersection = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    const union = areaA + areaB - intersection;

    if (union <= 0) return 0;
    return intersection / union;
  }

  function smoothBox(
    prev: FaceDetectionBox,
    next: FaceDetectionBox,
    alpha: number
  ): FaceDetectionBox {
    return {
      x: prev.x + (next.x - prev.x) * alpha,
      y: prev.y + (next.y - prev.y) * alpha,
      width: prev.width + (next.width - prev.width) * alpha,
      height: prev.height + (next.height - prev.height) * alpha
    };
  }

  function updateTrackedFaces(detections: FaceDetectionBox[], now: number) {
    const existing = trackedFacesRef.current;
    const used = new Set<number>();
    const nextTracked: TrackedFace[] = [];
    const matchThreshold = 0.3;
    const smoothing = 0.6;
    const maxAgeMs = 250;

    for (const detection of detections) {
      let bestIndex = -1;
      let bestScore = 0;

      for (let i = 0; i < existing.length; i += 1) {
        if (used.has(i)) continue;
        const score = computeIoU(existing[i].box, detection);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex >= 0 && bestScore >= matchThreshold) {
        const matched = existing[bestIndex];
        nextTracked.push({
          id: matched.id,
          box: smoothBox(matched.box, detection, smoothing),
          lastSeen: now
        });
        used.add(bestIndex);
      } else {
        nextTracked.push({
          id: `face_${nextTrackIdRef.current++}`,
          box: detection,
          lastSeen: now
        });
      }
    }

    for (let i = 0; i < existing.length; i += 1) {
      if (used.has(i)) continue;
      if (now - existing[i].lastSeen <= maxAgeMs) {
        nextTracked.push(existing[i]);
      }
    }

    trackedFacesRef.current = nextTracked;
    setTrackedFaces(nextTracked);
  }

  function detectFaces() {
    if (!videoRef.current || !canvasRef.current || !faceDetector) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const clientWidth = video.clientWidth;
    const clientHeight = video.clientHeight;
    if (
      clientWidth !== lastClientSizeRef.current.width ||
      clientHeight !== lastClientSizeRef.current.height ||
      video.videoWidth !== lastClientSizeRef.current.videoWidth ||
      video.videoHeight !== lastClientSizeRef.current.videoHeight
    ) {
      lastClientSizeRef.current = {
        width: clientWidth,
        height: clientHeight,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      };
      updateCanvasSize();
    }

    const now = performance.now();
    const detections = faceDetector.detectForVideo(video, now);
    const detectionBoxes: FaceDetectionBox[] = [];
    const minBoxSize = Math.min(video.videoWidth, video.videoHeight) * 0.08;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.detections && detections.detections.length > 0) {
      detections.detections.forEach((detection: Detection) => {
        if (detection.boundingBox) {
          const bbox = detection.boundingBox;
          if (bbox.width < minBoxSize || bbox.height < minBoxSize) {
            return;
          }
          detectionBoxes.push({
            x: bbox.originX,
            y: bbox.originY,
            width: bbox.width,
            height: bbox.height
          });
        }
      });
    }

    setFaceCount(detectionBoxes.length);
    updateTrackedFaces(detectionBoxes, now);

    animationFrameRef.current = requestAnimationFrame(detectFaces);
  }

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  return {
    videoRef,
    canvasRef,
    faceCount,
    facingMode,
    switchCamera,
    trackedFaces,
    displayRect,
    isLoading,
    error
  };
}

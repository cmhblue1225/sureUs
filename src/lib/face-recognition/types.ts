export interface RecognitionResult {
  track_id: string;
  recognized: boolean;
  user_id: string | null;
  profile?: {
    name: string;
    email: string;
    department: string;
    job_role: string;
    office_location: string;
    mbti?: string;
  };
  confidence: number;
  method: string;
  latency_ms: number;
  error?: string;
}

export interface FaceDetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceDisplayRect {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  videoWidth: number;
  videoHeight: number;
}

export interface TrackedFace {
  id: string;
  box: FaceDetectionBox;
  lastSeen: number;
}

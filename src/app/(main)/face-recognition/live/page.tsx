'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video } from 'lucide-react';

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<string>('연결 대기 중');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initWebRTC();

    return () => {
      if (pc) {
        pc.close();
      }
    };
  }, []);

  async function initWebRTC() {
    try {
      setStatus('초기화 중...');

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });

      setPc(peerConnection);

      // Handle incoming track (video stream from mobile)
      peerConnection.ontrack = (event) => {
        console.log('원격 트랙 수신됨');
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('연결됨');
          setIsConnected(true);
        }
      };

      // Handle ICE connection state changes
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE 연결 상태:', peerConnection.iceConnectionState);
        const iceState = peerConnection.iceConnectionState;

        switch (iceState) {
          case 'connected':
            setStatus('연결됨');
            setIsConnected(true);
            break;
          case 'disconnected':
            setStatus('연결 끊김');
            setIsConnected(false);
            break;
          case 'failed':
            setStatus('연결 실패');
            setIsConnected(false);
            setError('ICE 연결 실패');
            break;
          default:
            setStatus(`ICE: ${iceState}`);
        }
      };

      const supabase = createClient();

      // Listen for offers from mobile app via Supabase Realtime
      const channel = supabase
        .channel('webrtc_signaling')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'webrtc_signals',
            filter: 'type=eq.offer'
          },
          async (payload) => {
            console.log('Offer 수신됨:', payload);
            await handleOffer(peerConnection, payload.new, supabase);
          }
        )
        .subscribe();

      setStatus('모바일 앱 대기 중...');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'WebRTC 초기화 실패';
      setError(errorMessage);
      setStatus('오류');
    }
  }

  async function handleOffer(
    peerConnection: RTCPeerConnection,
    signalData: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any
  ) {
    try {
      // Set remote description (offer from mobile)
      const offer = new RTCSessionDescription(signalData.data as RTCSessionDescriptionInit);
      await peerConnection.setRemoteDescription(offer);

      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Send answer back via Supabase (webrtc_signals table required)
      await supabase.from('webrtc_signals').insert({
        type: 'answer',
        data: answer
      });

      setStatus('Offer에 응답 중...');

      // Handle ICE candidates
      peerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          await supabase.from('webrtc_signals').insert({
            type: 'ice_candidate',
            data: event.candidate
          });
        }
      };
    } catch (err: unknown) {
      console.error('Offer 처리 오류:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Offer 처리 실패: ' + errorMessage);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/face-recognition">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">라이브 스트림</h1>
          <p className="text-sm text-muted-foreground">
            모바일 앱의 화면을 실시간으로 확인합니다 (WebRTC)
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive">
          {error}
        </div>
      )}

      {/* Status Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">연결 상태</p>
              <p className="text-lg font-semibold">{status}</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted'
            }`}></div>
          </div>
        </CardContent>
      </Card>

      {/* Video Display */}
      <Card>
        <CardContent className="p-0">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480'%3E%3Crect width='640' height='480' fill='%23111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='20'%3E스트림 대기 중...%3C/text%3E%3C/svg%3E"
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            사용 방법
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>모바일 앱을 열어주세요</li>
            <li>앱에서 &quot;스트림 시작&quot; 버튼을 누르세요</li>
            <li>몇 초 내에 이 화면에 모바일 화면이 나타납니다</li>
            <li>지연 시간은 약 500ms입니다</li>
          </ol>
        </CardContent>
      </Card>

      {/* Technical Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기술 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>구현 방식:</strong> WebRTC (Peer-to-Peer)
          </p>
          <p>
            <strong>시그널링:</strong> Supabase Realtime (postgres_changes)
          </p>
          <p>
            <strong>STUN 서버:</strong> Google STUN (stun.l.google.com)
          </p>
          <p className="pt-2 border-t border-border">
            <strong>참고:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">webrtc_signals</code> 테이블이
            Supabase 데이터베이스에 존재해야 합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

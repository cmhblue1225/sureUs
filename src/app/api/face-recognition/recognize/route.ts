import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 인증 체크
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Get RECOG_API_URL (server-side environment variable)
    const RECOG_API_URL = process.env.RECOG_API_URL || process.env.NEXT_PUBLIC_RECOG_API_URL;

    if (!RECOG_API_URL) {
      console.error('RECOG_API_URL is not configured');
      return NextResponse.json(
        { error: 'Recognition API URL이 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    // Parse FormData
    const formData = await request.formData();

    const trackId = formData.get('track_id');
    const timestamp = formData.get('timestamp');
    const image = formData.get('image');

    if (!trackId || !timestamp || !image) {
      return NextResponse.json(
        { error: '필수 매개변수가 누락되었습니다 (track_id, timestamp, image)' },
        { status: 400 }
      );
    }

    console.log(`Forwarding to: ${RECOG_API_URL}/recognize`);

    // Forward to FastAPI server_recognition directly
    const response = await fetch(`${RECOG_API_URL}/recognize`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Recognition server error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `인식 서버 오류: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[Recognize] Response:', JSON.stringify(result));
    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Recognition API error:', error);

    // Network errors (ECONNREFUSED, timeout, etc.)
    if (error instanceof Error && 'cause' in error) {
      const cause = error.cause as { code?: string };
      if (cause?.code === 'ECONNREFUSED') {
        return NextResponse.json(
          {
            error: '인식 서버에 연결할 수 없습니다',
            details: 'Recognition API가 실행 중인지 확인하세요',
            hint: 'Railway에서 RECOG_API_URL 환경 변수를 확인하세요'
          },
          { status: 503 }
        );
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '인식 중 오류가 발생했습니다', details: errorMessage },
      { status: 500 }
    );
  }
}

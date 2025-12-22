import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
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

    const serviceClient = createServiceClient();

    // Get all users with their face embedding status
    const { data: users, error: usersError } = await serviceClient
      .from('users')
      .select('id, email, created_at')
      .is('deleted_at', null)
      .order('email');

    if (usersError) {
      console.error('Users fetch error:', usersError);
      return NextResponse.json(
        { error: '사용자 목록 조회 실패' },
        { status: 500 }
      );
    }

    // Get all face embeddings
    const { data: embeddings, error: embeddingsError } = await serviceClient
      .from('face_embeddings')
      .select('user_id, updated_at');

    if (embeddingsError) {
      console.error('Embeddings fetch error:', embeddingsError);
      return NextResponse.json(
        { error: '임베딩 조회 실패' },
        { status: 500 }
      );
    }

    // Create a map of user_id to embedding info
    const embeddingMap = new Map(
      embeddings?.map(e => [e.user_id, e.updated_at]) || []
    );

    // Combine user data with embedding status
    const usersWithStatus = users?.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      has_embedding: embeddingMap.has(user.id),
      embedding_updated_at: embeddingMap.get(user.id) || null
    })) || [];

    return NextResponse.json({
      success: true,
      users: usersWithStatus
    });

  } catch (error: unknown) {
    console.error('Embeddings status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '상태 조회 중 오류가 발생했습니다', details: errorMessage },
      { status: 500 }
    );
  }
}

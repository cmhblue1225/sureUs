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
      .select('id, email, name, created_at, profiles(department)')
      .is('deleted_at', null)
      .order('email');

    if (usersError) {
      console.error('Users fetch error:', usersError);
      return NextResponse.json(
        { error: '사용자 목록 조회 실패' },
        { status: 500 }
      );
    }

    // Get all face identities from fr_identities
    const { data: identities, error: identitiesError } = await serviceClient
      .from('fr_identities')
      .select('external_key, updated_at, embedding')
      .eq('is_active', true);

    if (identitiesError) {
      console.error('Identities fetch error:', identitiesError);
      return NextResponse.json(
        { error: '임베딩 조회 실패' },
        { status: 500 }
      );
    }

    // Create a map of external_key (user_id) to updated_at
    // Only include records where embedding actually exists (not null)
    // Note: embedding can be stored as a string (JSON) or array depending on DB type
    const embeddingMap = new Map(
      identities
        ?.filter(e => {
          if (e.embedding === null || e.embedding === undefined) return false;
          // Check if it's a non-empty string (JSON format) or a non-empty array
          if (typeof e.embedding === 'string') {
            return e.embedding.length > 2; // More than "[]"
          }
          if (Array.isArray(e.embedding)) {
            return e.embedding.length > 0;
          }
          return false;
        })
        .map(e => [e.external_key, e.updated_at]) || []
    );

    // Combine user data with embedding status
    const usersWithStatus = users?.map(user => {
      const profile = user.profiles as { department?: string } | null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        department: profile?.department || null,
        created_at: user.created_at,
        has_embedding: embeddingMap.has(user.id),
        embedding_updated_at: embeddingMap.get(user.id) || null
      };
    }) || [];

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

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const { error: deleteError } = await serviceClient
      .from('fr_identities')
      .delete()
      .eq('external_key', userId);

    if (deleteError) {
      console.error('Delete embedding error:', deleteError);
      return NextResponse.json(
        { error: '임베딩 삭제 실패', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '얼굴 임베딩이 삭제되었습니다'
    });

  } catch (error: unknown) {
    console.error('Delete embedding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다', details: errorMessage },
      { status: 500 }
    );
  }
}

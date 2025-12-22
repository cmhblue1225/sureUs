import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

    const RECOG_API_URL = process.env.RECOG_API_URL || process.env.NEXT_PUBLIC_RECOG_API_URL;

    if (!RECOG_API_URL) {
      return NextResponse.json(
        { error: 'Recognition API URL이 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const faceImage = formData.get('face') as File;
    const userName = formData.get('name') as string;
    const userEmail = formData.get('email') as string;
    const userOrg = formData.get('org') as string;

    if (!userId || !faceImage) {
      return NextResponse.json(
        { error: '필수 매개변수가 누락되었습니다 (userId, face)' },
        { status: 400 }
      );
    }

    // Forward to FastAPI to extract embedding
    const extractFormData = new FormData();
    extractFormData.append('image', faceImage);

    const extractResponse = await fetch(`${RECOG_API_URL}/extract-embedding`, {
      method: 'POST',
      body: extractFormData,
    });

    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error(`Extract embedding error (${extractResponse.status}):`, errorText);
      return NextResponse.json(
        { error: '임베딩 추출 실패', details: errorText },
        { status: extractResponse.status }
      );
    }

    const extractResult = await extractResponse.json();

    if (!extractResult.embedding || !Array.isArray(extractResult.embedding)) {
      return NextResponse.json(
        { error: '유효한 임베딩을 추출할 수 없습니다' },
        { status: 400 }
      );
    }

    // Save embedding to Supabase fr_identities table
    const serviceClient = createServiceClient();

    // Upload image to Supabase storage and get URL
    const fileBuffer = await faceImage.arrayBuffer();
    const fileExt = faceImage.name.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('face-photos')
      .upload(fileName, fileBuffer, {
        contentType: faceImage.type,
        upsert: true
      });

    let photoUrl = '';
    if (uploadError) {
      console.warn('Photo upload warning:', uploadError.message);
      // Use placeholder if upload fails
      photoUrl = '/favicon.ico';
    } else {
      const { data: urlData } = serviceClient.storage
        .from('face-photos')
        .getPublicUrl(uploadData.path);
      photoUrl = urlData.publicUrl;
    }

    // Check if identity already exists for this user (any source)
    const { data: existingIdentity } = await serviceClient
      .from('fr_identities')
      .select('id, source')
      .eq('external_key', userId)
      .single();

    if (existingIdentity) {
      // Update existing identity
      const { error: updateError } = await serviceClient
        .from('fr_identities')
        .update({
          name: userName || 'Unknown',
          email: userEmail || null,
          org: userOrg || null,
          photo_url: photoUrl,
          embedding: extractResult.embedding,
          updated_at: new Date().toISOString()
        })
        .eq('external_key', userId);

      if (updateError) {
        console.error('Update identity error:', updateError);
        return NextResponse.json(
          { error: '임베딩 업데이트 실패', details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      // Insert new identity
      const { error: insertError } = await serviceClient
        .from('fr_identities')
        .insert({
          source: 'sureNet',
          external_key: userId,
          name: userName || 'Unknown',
          email: userEmail || null,
          org: userOrg || null,
          photo_url: photoUrl,
          embedding: extractResult.embedding,
          embedding_model: 'face_recognition_dlib',
          embedding_version: 'v1',
          is_active: true
        });

      if (insertError) {
        console.error('Insert identity error:', insertError);
        return NextResponse.json(
          { error: '임베딩 저장 실패', details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '얼굴 등록이 완료되었습니다'
    });

  } catch (error: unknown) {
    console.error('Upload face error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: '얼굴 등록 중 오류가 발생했습니다', details: errorMessage },
      { status: 500 }
    );
  }
}

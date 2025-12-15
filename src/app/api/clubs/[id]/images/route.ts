import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/clubs/[id]/images - 이미지 업로드
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 이미지를 업로드할 수 있습니다." },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "JPEG, PNG, WebP, GIF 이미지만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    // Validate file size (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "파일 크기는 20MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${clubId}/${user.id}/${timestamp}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("club-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "이미지 업로드 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("club-images")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: uploadData.path,
      },
    });
  } catch (error) {
    console.error("Image upload API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/images - 이미지 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check membership and role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 이미지를 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json(
        { success: false, error: "삭제할 이미지 경로가 필요합니다." },
        { status: 400 }
      );
    }

    // Verify the path belongs to this club
    if (!path.startsWith(`${clubId}/`)) {
      return NextResponse.json(
        { success: false, error: "이 동호회의 이미지만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // Check ownership - path format: clubId/userId/timestamp.ext
    const pathParts = path.split("/");
    const imageOwnerId = pathParts[1];

    // Only owner or leader can delete
    if (imageOwnerId !== user.id && membership.role !== "leader") {
      return NextResponse.json(
        { success: false, error: "이미지 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from("club-images")
      .remove([path]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: "이미지 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "이미지가 삭제되었습니다." },
    });
  } catch (error) {
    console.error("Image delete API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

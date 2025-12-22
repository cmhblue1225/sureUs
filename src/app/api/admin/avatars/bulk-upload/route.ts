import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Check admin role from profiles table
    const serviceClient = createServiceClient();
    const { data: profileData } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileData?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const entries = formData.getAll("files") as File[];
    const userIds = formData.getAll("userIds") as string[];

    if (entries.length === 0 || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "파일과 사용자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (entries.length !== userIds.length) {
      return NextResponse.json(
        { success: false, error: "파일 수와 사용자 ID 수가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    const results: { userId: string; success: boolean; avatarUrl?: string; error?: string }[] = [];

    for (let i = 0; i < entries.length; i++) {
      const file = entries[i];
      const userId = userIds[i];

      try {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          results.push({ userId, success: false, error: "지원하지 않는 파일 형식" });
          continue;
        }

        // Generate filename
        const ext = file.name.split(".").pop() || "jpg";
        const filename = `${userId}/avatar-${Date.now()}.${ext}`;

        // Upload to storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await serviceClient.storage
          .from("avatars")
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${userId}:`, uploadError);
          results.push({ userId, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = serviceClient.storage
          .from("avatars")
          .getPublicUrl(filename);

        // Update user's avatar_url
        const { error: updateError } = await serviceClient
          .from("users")
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", userId);

        if (updateError) {
          console.error(`Update error for ${userId}:`, updateError);
          results.push({ userId, success: false, error: updateError.message });
          continue;
        }

        results.push({ userId, success: true, avatarUrl: publicUrl });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        results.push({ userId, success: false, error: errorMessage });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        total: results.length,
        successful,
        failed,
        results,
      },
    });
  } catch (error) {
    console.error("Bulk avatar upload error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

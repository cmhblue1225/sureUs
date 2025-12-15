import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// GET /api/user - Get current user info
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get user data from users table
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, name, avatar_url")
      .eq("id", user.id)
      .single<{ id: string; email: string; name: string; avatar_url?: string }>();

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: userData?.name || user.email?.split("@")[0],
        avatarUrl: userData?.avatar_url,
      },
    });
  } catch (error) {
    console.error("User GET API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/user - Delete user and all data
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmationPhrase } = body;

    // Require confirmation phrase
    if (confirmationPhrase !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { success: false, error: "확인 문구가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const deletedAt = new Date().toISOString();
    const dataRemoved = {
      matchesCache: false,
      viewLogs: false,
      embeddings: false,
      preferences: false,
      tags: false,
      profile: false,
      user: false,
    };

    try {
      // 1. Delete matches_cache
      await serviceClient
        .from("matches_cache")
        .delete()
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`);
      dataRemoved.matchesCache = true;

      // 2. Delete profile_view_logs
      await serviceClient
        .from("profile_view_logs")
        .delete()
        .or(`viewer_id.eq.${user.id},viewed_id.eq.${user.id}`);
      dataRemoved.viewLogs = true;

      // 3. Delete embeddings
      await serviceClient
        .from("embeddings")
        .delete()
        .eq("user_id", user.id);
      dataRemoved.embeddings = true;

      // 4. Delete preferences
      await serviceClient
        .from("preferences")
        .delete()
        .eq("user_id", user.id);
      dataRemoved.preferences = true;

      // 5. Get profile ID and delete tags
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single<{ id: string }>();

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient.from("profile_tags") as any)
          .delete()
          .eq("profile_id", profile.id);
        dataRemoved.tags = true;
      }

      // 6. Delete profile
      await serviceClient
        .from("profiles")
        .delete()
        .eq("user_id", user.id);
      dataRemoved.profile = true;

      // 7. Delete user record (soft delete or hard delete based on preference)
      // Using hard delete - the auth user will be deleted by Supabase cascade
      await serviceClient
        .from("users")
        .delete()
        .eq("id", user.id);
      dataRemoved.user = true;

      // 8. Sign out the user
      await supabase.auth.signOut();

      return NextResponse.json({
        success: true,
        data: {
          deletedAt,
          dataRemoved,
        },
      });
    } catch (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "데이터 삭제 중 오류가 발생했습니다.",
          dataRemoved,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("User delete API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

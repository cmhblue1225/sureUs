import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/dashboard - 대시보드 통계 및 데이터 조회
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

    const serviceClient = createServiceClient();

    // 사용자 프로필 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (serviceClient
      .from("profiles")
      .select("*, users!inner(name, avatar_url)")
      .eq("user_id", user.id)
      .single() as any);

    const userName = profile?.users?.name || "사용자";
    const userAvatar = profile?.users?.avatar_url || null;
    const department = profile?.department || "";
    const jobRole = profile?.job_role || "";
    const hasProfile = profile?.is_profile_complete ?? false;

    // 병렬로 통계 데이터 조회
    const [
      unreadMessagesResult,
      unreadNotificationsResult,
      myClubsResult,
      recentClubPostsResult,
      recommendationsCountResult,
    ] = await Promise.all([
      // 읽지 않은 메시지 수
      serviceClient
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false),

      // 읽지 않은 알림 수
      serviceClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),

      // 가입한 동호회 목록
      serviceClient
        .from("club_members")
        .select(`
          club_id,
          role,
          clubs!inner(id, name, description, category, member_count, image_url)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(5),

      // 가입한 동호회의 최근 게시물
      serviceClient
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id)
        .eq("status", "active"),

      // 추천 동료 수 (전체 활성 프로필 수 - 본인)
      serviceClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_profile_complete", true)
        .neq("user_id", user.id),
    ]);

    // 가입한 동호회의 최근 게시물 조회
    const myClubIds = (recentClubPostsResult.data || []).map((m: { club_id: string }) => m.club_id);

    let recentPosts: Array<{
      id: string;
      title: string;
      type: string;
      created_at: string;
      club: { id: string; name: string };
      author: { name: string; avatar_url: string | null };
    }> = [];

    if (myClubIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: posts } = await (serviceClient
        .from("club_posts")
        .select(`
          id,
          title,
          type,
          created_at,
          clubs!inner(id, name),
          author:users!club_posts_author_id_fkey(name, avatar_url)
        `)
        .in("club_id", myClubIds)
        .order("created_at", { ascending: false })
        .limit(5) as any);

      recentPosts = (posts || []).map((post: {
        id: string;
        title: string;
        type: string;
        created_at: string;
        clubs: { id: string; name: string };
        author: { name: string; avatar_url: string | null };
      }) => ({
        id: post.id,
        title: post.title,
        type: post.type,
        created_at: post.created_at,
        club: post.clubs,
        author: post.author,
      }));
    }

    // 통계 데이터 집계
    const stats = {
      unreadMessages: unreadMessagesResult.count || 0,
      unreadNotifications: unreadNotificationsResult.count || 0,
      myClubsCount: (myClubsResult.data || []).length,
      totalRecommendations: recommendationsCountResult.count || 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myClubs = (myClubsResult.data || []).map((m: any) => ({
      id: m.clubs.id,
      name: m.clubs.name,
      description: m.clubs.description,
      category: m.clubs.category,
      memberCount: m.clubs.member_count,
      imageUrl: m.clubs.image_url,
      role: m.role,
    }));

    return NextResponse.json({
      success: true,
      data: {
        userName,
        userAvatar,
        department,
        jobRole,
        hasProfile,
        stats,
        myClubs,
        recentPosts,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

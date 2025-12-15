import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  generateActivitySummary,
  isAnthropicAvailable,
} from "@/lib/anthropic/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clubs/[id]/activity-summary - AI로 활동 요약 생성
export async function GET(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: "동호회 회원만 활동 요약을 볼 수 있습니다." },
        { status: 403 }
      );
    }

    // Check if Anthropic API is available
    if (!isAnthropicAvailable()) {
      return NextResponse.json(
        { success: false, error: "AI 기능을 사용할 수 없습니다." },
        { status: 503 }
      );
    }

    // Get club name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (serviceClient
      .from("clubs")
      .select("name")
      .eq("id", clubId)
      .single() as any);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get recent posts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentPosts } = await (serviceClient
      .from("club_posts")
      .select("title")
      .eq("club_id", clubId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(10) as any);

    // Get chat message count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: chatCount } = await (serviceClient
      .from("club_chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("created_at", sevenDaysAgo.toISOString()) as any);

    // Get active members count (members who posted or chatted)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activePosters } = await (serviceClient
      .from("club_posts")
      .select("author_id")
      .eq("club_id", clubId)
      .gte("created_at", sevenDaysAgo.toISOString()) as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeChatters } = await (serviceClient
      .from("club_chat_messages")
      .select("sender_id")
      .eq("club_id", clubId)
      .gte("created_at", sevenDaysAgo.toISOString()) as any);

    const activeUserIds = new Set([
      ...(activePosters?.map((p: { author_id: string }) => p.author_id) || []),
      ...(activeChatters?.map((c: { sender_id: string }) => c.sender_id) || []),
    ]);

    const postTitles = recentPosts?.map((p: { title: string }) => p.title) || [];
    const totalPosts = recentPosts?.length || 0;
    const totalChats = chatCount || 0;
    const activeMembers = activeUserIds.size;

    // Generate summary if there's any activity
    if (totalPosts === 0 && totalChats === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: "이번 주에는 아직 활동이 없습니다. 첫 게시물을 작성하거나 채팅을 시작해보세요!",
          stats: {
            totalPosts,
            totalChats,
            activeMembers,
          },
          generated: false,
        },
      });
    }

    const summary = await generateActivitySummary(
      club.name,
      postTitles,
      totalPosts,
      totalChats,
      activeMembers
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: summary || `이번 주 ${club.name}에서 ${totalPosts}개의 게시물이 작성되었고, ${totalChats}개의 채팅이 오갔습니다. ${activeMembers}명의 회원이 활발히 참여했습니다.`,
        stats: {
          totalPosts,
          totalChats,
          activeMembers,
        },
        generated: !!summary,
      },
    });
  } catch (error) {
    console.error("Activity summary API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

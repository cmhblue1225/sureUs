import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clubs/[id] - 동호회 상세 조회
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

    // Get club details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club, error: clubError } = await (serviceClient
      .from("clubs")
      .select(`
        *,
        leader:users!clubs_leader_id_fkey(id, name, avatar_url)
      `)
      .eq("id", clubId)
      .eq("is_active", true)
      .single() as any);

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check user membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("role, status, joined_at")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    // Check pending request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingRequest } = await (serviceClient
      .from("club_join_requests")
      .select("id, created_at")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single() as any);

    // Get recent members (first 5)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentMembers } = await (serviceClient
      .from("club_members")
      .select(`
        user_id,
        role,
        joined_at,
        user:users!club_members_user_id_fkey(id, name, avatar_url)
      `)
      .eq("club_id", clubId)
      .eq("status", "active")
      .order("joined_at", { ascending: false })
      .limit(5) as any);

    // Get pending requests count (for leader)
    let pendingRequestsCount = 0;
    if (club.leader_id === user.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (serviceClient
        .from("club_join_requests")
        .select("*", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("status", "pending") as any);
      pendingRequestsCount = count || 0;
    }

    // Get recent activity (posts count)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: recentPostsCount } = await (serviceClient
      .from("club_posts")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as any);

    return NextResponse.json({
      success: true,
      data: {
        ...club,
        isMember: !!membership,
        isLeader: club.leader_id === user.id,
        memberRole: membership?.role || null,
        memberSince: membership?.joined_at || null,
        hasPendingRequest: !!pendingRequest,
        pendingRequestId: pendingRequest?.id || null,
        recentMembers: recentMembers || [],
        pendingRequestsCount,
        recentPostsCount: recentPostsCount || 0,
      },
    });
  } catch (error) {
    console.error("Club detail API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/clubs/[id] - 동호회 수정 (회장만)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check if user is leader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (serviceClient
      .from("clubs")
      .select("leader_id")
      .eq("id", clubId)
      .single() as any);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (club.leader_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "회장만 동호회를 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, category, imageUrl, joinPolicy, tags } = body;

    // Validate category if provided
    if (category) {
      const validCategories = ["스포츠", "취미", "자기개발", "기술/IT", "소셜", "문화/예술", "기타"];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { success: false, error: "유효하지 않은 카테고리입니다." },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (imageUrl !== undefined) updateData.image_url = imageUrl;
    if (joinPolicy !== undefined) updateData.join_policy = joinPolicy;
    if (tags !== undefined) updateData.tags = tags;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedClub, error: updateError } = await (serviceClient
      .from("clubs") as any)
      .update(updateData)
      .eq("id", clubId)
      .select()
      .single();

    if (updateError) {
      console.error("Club update error:", updateError);
      return NextResponse.json(
        { success: false, error: "동호회 수정 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedClub,
    });
  } catch (error) {
    console.error("Club update API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id] - 동호회 삭제 (회장만)
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

    // Check if user is leader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (serviceClient
      .from("clubs")
      .select("leader_id")
      .eq("id", clubId)
      .single() as any);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (club.leader_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "회장만 동호회를 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // Soft delete - set is_active to false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceClient
      .from("clubs") as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", clubId);

    if (deleteError) {
      console.error("Club delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: "동호회 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "동호회가 삭제되었습니다." },
    });
  } catch (error) {
    console.error("Club delete API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

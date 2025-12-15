import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clubs/[id]/members - 회원 목록 조회
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

    // Verify club exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (serviceClient
      .from("clubs")
      .select("id, leader_id")
      .eq("id", clubId)
      .single() as any);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Get members with user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members, error: membersError, count } = await (serviceClient
      .from("club_members")
      .select(`
        id,
        user_id,
        role,
        status,
        joined_at,
        user:users!club_members_user_id_fkey(
          id,
          name,
          avatar_url
        )
      `, { count: "exact" })
      .eq("club_id", clubId)
      .eq("status", "active")
      .order("role", { ascending: true })
      .order("joined_at", { ascending: true })
      .range(offset, offset + limit - 1) as any);

    if (membersError) {
      console.error("Members fetch error:", membersError);
      return NextResponse.json(
        { success: false, error: "회원 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Get profiles for department/job info
    const userIds = members?.map((m: { user_id: string }) => m.user_id) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (serviceClient
      .from("profiles")
      .select("user_id, department, job_role")
      .in("user_id", userIds) as any);

    const profileMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profiles?.map((p: any) => [p.user_id, { department: p.department, jobRole: p.job_role }]) || []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membersWithProfiles = members?.map((member: any) => ({
      ...member,
      profile: profileMap.get(member.user_id) || null,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        members: membersWithProfiles,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
        isLeader: club.leader_id === user.id,
      },
    });
  } catch (error) {
    console.error("Members API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

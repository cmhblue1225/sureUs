import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clubs/[id]/requests - 가입 신청 목록 조회 (회장만)
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
        { success: false, error: "회장만 가입 신청 목록을 볼 수 있습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // Get join requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: requests, error: requestsError } = await (serviceClient
      .from("club_join_requests")
      .select(`
        id,
        user_id,
        message,
        status,
        created_at,
        reviewed_at,
        user:users!club_join_requests_user_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .eq("club_id", clubId)
      .eq("status", status)
      .order("created_at", { ascending: false }) as any);

    if (requestsError) {
      console.error("Requests fetch error:", requestsError);
      return NextResponse.json(
        { success: false, error: "가입 신청 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Get profiles for department/job info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = requests?.map((r: any) => r.user_id) || [];
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
    const requestsWithProfiles = requests?.map((request: any) => ({
      ...request,
      profile: profileMap.get(request.user_id) || null,
    })) || [];

    return NextResponse.json({
      success: true,
      data: requestsWithProfiles,
    });
  } catch (error) {
    console.error("Requests API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

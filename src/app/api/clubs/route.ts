import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/clubs - 동호회 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const myClubs = searchParams.get("myClubs") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const serviceClient = createServiceClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (serviceClient
      .from("clubs")
      .select(`
        *,
        leader:users!clubs_leader_id_fkey(id, name, avatar_url)
      `, { count: "exact" })
      .eq("is_active", true)
      .order("created_at", { ascending: false }) as any);

    // Filter by category
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter by my clubs
    if (myClubs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: myMemberships } = await (serviceClient
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id)
        .eq("status", "active") as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const myClubIds = myMemberships?.map((m: any) => m.club_id) || [];
      if (myClubIds.length > 0) {
        query = query.in("id", myClubIds);
      } else {
        // No clubs joined
        return NextResponse.json({
          success: true,
          data: {
            clubs: [],
            pagination: {
              page,
              limit,
              total: 0,
              hasMore: false,
            },
          },
        });
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clubs, error, count } = await query;

    if (error) {
      console.error("Clubs fetch error:", error);
      return NextResponse.json(
        { success: false, error: "동호회 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Check user membership for each club
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userMemberships } = await (serviceClient
      .from("club_members")
      .select("club_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active") as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membershipMap = new Map<string, { role: string; status: string }>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userMemberships?.map((m: any) => [m.club_id, { role: m.role, status: m.status }]) || []
    );

    // Check pending join requests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingRequests } = await (serviceClient
      .from("club_join_requests")
      .select("club_id")
      .eq("user_id", user.id)
      .eq("status", "pending") as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingClubIds = new Set(pendingRequests?.map((r: any) => r.club_id) || []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubsWithMembership = clubs?.map((club: any) => ({
      ...club,
      isMember: membershipMap.has(club.id),
      isLeader: club.leader_id === user.id,
      memberRole: membershipMap.get(club.id)?.role || null,
      hasPendingRequest: pendingClubIds.has(club.id),
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        clubs: clubsWithMembership,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    console.error("Clubs API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/clubs - 동호회 생성
export async function POST(request: Request) {
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
    const { name, description, category, imageUrl, joinPolicy, tags } = body;

    // Validation
    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "동호회 이름과 카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    const validCategories = ["스포츠", "취미", "자기개발", "기술/IT", "소셜", "문화/예술", "기타"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 카테고리입니다." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Create club
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club, error: createError } = await (serviceClient
      .from("clubs") as any)
      .insert({
        name,
        description: description || null,
        category,
        image_url: imageUrl || null,
        join_policy: joinPolicy || "public",
        leader_id: user.id,
        tags: tags || [],
        member_count: 1,
      })
      .select()
      .single();

    if (createError) {
      console.error("Club create error:", createError);
      return NextResponse.json(
        { success: false, error: "동호회를 생성할 수 없습니다." },
        { status: 500 }
      );
    }

    // Add leader as member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: memberError } = await (serviceClient
      .from("club_members") as any)
      .insert({
        club_id: club.id,
        user_id: user.id,
        role: "leader",
        status: "active",
      });

    if (memberError) {
      console.error("Member add error:", memberError);
      // Rollback club creation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient.from("clubs") as any).delete().eq("id", club.id);
      return NextResponse.json(
        { success: false, error: "회원 추가 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: club,
    });
  } catch (error) {
    console.error("Club create API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

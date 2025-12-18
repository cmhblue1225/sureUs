import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/cohorts/[id]/users - 기수별 사용자 목록 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const serviceClient = createServiceClient();

    // 기수 존재 확인
    const { data: cohort, error: cohortError } = await serviceClient
      .from("cohorts")
      .select("id, name")
      .eq("id", id)
      .single();

    if (cohortError || !cohort) {
      return NextResponse.json(
        { success: false, error: "기수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 목록 조회
    let query = serviceClient
      .from("profiles")
      .select(
        `
        user_id,
        org_level1,
        org_level2,
        org_level3,
        role,
        users!inner(id, name, email, employee_id, phone_number)
      `,
        { count: "exact" }
      )
      .eq("cohort_id", id)
      .order("created_at", { ascending: false });

    // 검색어 필터 (이름 또는 이메일)
    if (search) {
      query = query.or(`users.name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch cohort users:", error);
      return NextResponse.json(
        { success: false, error: "사용자 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = (data || []).map((profile: any) => ({
      id: profile.user_id,
      name: profile.users?.name || "",
      email: profile.users?.email || "",
      employeeId: profile.users?.employee_id || null,
      phoneNumber: profile.users?.phone_number || null,
      orgLevel1: profile.org_level1,
      orgLevel2: profile.org_level2,
      orgLevel3: profile.org_level3,
      role: profile.role,
    }));

    return NextResponse.json({
      success: true,
      data: {
        cohort: {
          id: cohort.id,
          name: cohort.name,
        },
        users,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * POST /api/admin/cohorts/[id]/users - 사용자를 이 기수로 이동
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id: targetCohortId } = await params;
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "이동할 사용자를 선택해주세요." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 대상 기수 존재 확인
    const { data: targetCohort, error: cohortError } = await serviceClient
      .from("cohorts")
      .select("id, name")
      .eq("id", targetCohortId)
      .single();

    if (cohortError || !targetCohort) {
      return NextResponse.json(
        { success: false, error: "대상 기수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자들 기수 변경
    const { error: updateError, count } = await serviceClient
      .from("profiles")
      .update({ cohort_id: targetCohortId, updated_at: new Date().toISOString() })
      .in("user_id", userIds);

    if (updateError) {
      console.error("Failed to move users:", updateError);
      return NextResponse.json(
        { success: false, error: "사용자 이동에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `${count || userIds.length}명의 사용자가 '${targetCohort.name}' 기수로 이동되었습니다.`,
        movedCount: count || userIds.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

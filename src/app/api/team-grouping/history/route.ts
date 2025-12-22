import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";
import { getEffectiveCohortId } from "@/lib/utils/cohort";

/**
 * GET /api/team-grouping/history
 *
 * 조 편성 이력 조회 API (관리자 전용)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const isAdmin = await checkIsAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 기수 ID 가져오기
    const cohortId = await getEffectiveCohortId(supabase, user.id, true);
    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = (page - 1) * limit;

    const serviceClient = createServiceClient();

    // 이력 조회 (최신순)
    const { data: history, error: historyError, count } = await serviceClient
      .from("team_groupings")
      .select("id, criteria_text, team_count, team_size, created_at, shared_via", {
        count: "exact",
      })
      .eq("cohort_id", cohortId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (historyError) {
      console.error("Error fetching history:", historyError);
      return NextResponse.json(
        { success: false, error: "이력을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: history || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error("Team grouping history error:", error);
    return NextResponse.json(
      { success: false, error: "이력 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team-grouping/history/[id]
 *
 * 특정 조 편성 상세 조회
 */
export async function getGroupingDetail(groupingId: string) {
  // 이 함수는 별도 라우트에서 사용할 수 있도록 export
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("team_groupings")
    .select("*")
    .eq("id", groupingId)
    .single();

  if (error) {
    return { success: false, error: "조 편성을 찾을 수 없습니다." };
  }

  return {
    success: true,
    data: {
      id: data.id,
      cohortId: data.cohort_id,
      criteriaText: data.criteria_text,
      criteriaParsed: data.criteria_parsed,
      teamSize: data.team_size,
      teamCount: data.team_count,
      teams: data.teams_json,
      ungroupedMembers: data.ungrouped_members,
      createdBy: data.created_by,
      createdAt: data.created_at,
      sharedVia: data.shared_via,
      sharedAt: data.shared_at,
    },
  };
}

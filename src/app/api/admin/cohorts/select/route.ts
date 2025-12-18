import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import {
  setAdminSelectedCohort,
  clearAdminSelectedCohort,
  getAdminSelectedCohort,
} from "@/lib/utils/cohort";

/**
 * GET /api/admin/cohorts/select - 현재 선택된 기수 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const selectedCohortId = await getAdminSelectedCohort();

    if (!selectedCohortId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const serviceClient = createServiceClient();
    const { data: cohort } = await serviceClient
      .from("cohorts")
      .select("id, name, description, is_active")
      .eq("id", selectedCohortId)
      .single();

    if (!cohort) {
      // 쿠키에 저장된 기수가 삭제된 경우 쿠키 클리어
      await clearAdminSelectedCohort();
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: cohort.id,
        name: cohort.name,
        description: cohort.description,
        isActive: cohort.is_active,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * POST /api/admin/cohorts/select - 기수 선택 (쿠키 설정)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { cohortId } = await request.json();

    if (!cohortId || typeof cohortId !== "string") {
      return NextResponse.json(
        { success: false, error: "기수 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 기수 존재 및 활성 상태 확인
    const { data: cohort, error } = await serviceClient
      .from("cohorts")
      .select("id, name, is_active")
      .eq("id", cohortId)
      .single();

    if (error || !cohort) {
      return NextResponse.json(
        { success: false, error: "기수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!cohort.is_active) {
      return NextResponse.json(
        { success: false, error: "비활성화된 기수는 선택할 수 없습니다." },
        { status: 400 }
      );
    }

    // 쿠키 설정
    await setAdminSelectedCohort(cohortId);

    return NextResponse.json({
      success: true,
      data: {
        id: cohort.id,
        name: cohort.name,
        message: `'${cohort.name}' 기수가 선택되었습니다.`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * DELETE /api/admin/cohorts/select - 기수 선택 해제 (쿠키 삭제)
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    await clearAdminSelectedCohort();

    return NextResponse.json({
      success: true,
      data: { message: "기수 선택이 해제되었습니다." },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";

/**
 * GET /api/admin/cohorts - 기수 목록 조회
 */
export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const serviceClient = createServiceClient();

    // 기수 목록 + 각 기수별 사용자 수
    const { data: cohorts, error } = await serviceClient
      .from("cohorts")
      .select("id, name, description, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch cohorts:", error);
      return NextResponse.json(
        { success: false, error: "기수 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 각 기수별 사용자 수 조회
    const cohortsWithCount = await Promise.all(
      (cohorts || []).map(async (cohort) => {
        const { count } = await serviceClient
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("cohort_id", cohort.id);

        return {
          id: cohort.id,
          name: cohort.name,
          description: cohort.description,
          isActive: cohort.is_active,
          userCount: count || 0,
          createdAt: cohort.created_at,
          updatedAt: cohort.updated_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: cohortsWithCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * POST /api/admin/cohorts - 기수 생성
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { name, description } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "기수 이름은 필수입니다." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 중복 이름 체크
    const { data: existing } = await serviceClient
      .from("cohorts")
      .select("id")
      .eq("name", name.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "이미 동일한 이름의 기수가 존재합니다." },
        { status: 400 }
      );
    }

    // 기수 생성
    const { data: newCohort, error } = await serviceClient
      .from("cohorts")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create cohort:", error);
      return NextResponse.json(
        { success: false, error: "기수 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newCohort.id,
        name: newCohort.name,
        description: newCohort.description,
        isActive: newCohort.is_active,
        userCount: 0,
        createdAt: newCohort.created_at,
        updatedAt: newCohort.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/cohorts/[id] - 기수 상세 조회
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id } = await params;
    const serviceClient = createServiceClient();

    const { data: cohort, error } = await serviceClient
      .from("cohorts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !cohort) {
      return NextResponse.json(
        { success: false, error: "기수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 수 조회
    const { count } = await serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", id);

    return NextResponse.json({
      success: true,
      data: {
        id: cohort.id,
        name: cohort.name,
        description: cohort.description,
        isActive: cohort.is_active,
        userCount: count || 0,
        createdAt: cohort.created_at,
        updatedAt: cohort.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * PUT /api/admin/cohorts/[id] - 기수 수정
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id } = await params;
    const { name, description, isActive } = await request.json();

    const serviceClient = createServiceClient();

    // 기수 존재 확인
    const { data: existing, error: findError } = await serviceClient
      .from("cohorts")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "기수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이름 중복 체크 (자신 제외)
    if (name) {
      const { data: duplicate } = await serviceClient
        .from("cohorts")
        .select("id")
        .eq("name", name.trim())
        .neq("id", id)
        .single();

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "이미 동일한 이름의 기수가 존재합니다." },
          { status: 400 }
        );
      }
    }

    // 업데이트
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: updated, error: updateError } = await serviceClient
      .from("cohorts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update cohort:", updateError);
      return NextResponse.json(
        { success: false, error: "기수 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    // 사용자 수 조회
    const { count } = await serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", id);

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        isActive: updated.is_active,
        userCount: count || 0,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * DELETE /api/admin/cohorts/[id] - 기수 삭제
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id } = await params;
    const serviceClient = createServiceClient();

    // 기수 존재 확인
    const { data: existing, error: findError } = await serviceClient
      .from("cohorts")
      .select("id, name")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { success: false, error: "기수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 수 확인 (사용자가 있으면 삭제 불가)
    const { count } = await serviceClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("cohort_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${count}명의 사용자가 속해 있어 삭제할 수 없습니다. 먼저 사용자를 다른 기수로 이동해주세요.`,
        },
        { status: 400 }
      );
    }

    // 삭제
    const { error: deleteError } = await serviceClient
      .from("cohorts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Failed to delete cohort:", deleteError);
      return NextResponse.json(
        { success: false, error: "기수 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: `기수 '${existing.name}'가 삭제되었습니다.` },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

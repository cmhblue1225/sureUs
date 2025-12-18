import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { formatPhoneNumber } from "@/lib/utils/csv";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

interface UpdateEmployeeData {
  name?: string;
  employeeId?: string;
  orgLevel1?: string;
  orgLevel2?: string;
  orgLevel3?: string;
  phoneNumber?: string;
  birthdate?: string;
  gender?: "male" | "female" | "other";
}

/**
 * GET /api/admin/employees/[id] - 특정 직원 정보 조회
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeUserId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    await requireAdmin(supabase);

    const serviceClient = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error: userError } = await (serviceClient as any)
      .from("users")
      .select(`
        id,
        employee_id,
        name,
        email,
        phone_number,
        birthdate,
        gender,
        created_at,
        profiles(org_level1, org_level2, org_level3, cohort_id)
      `)
      .eq("id", employeeUserId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "직원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profile = userData.profiles?.[0] || userData.profiles;

    return NextResponse.json({
      success: true,
      data: {
        id: userData.id,
        employeeId: userData.employee_id,
        name: userData.name,
        email: userData.email,
        orgLevel1: profile?.org_level1 || "",
        orgLevel2: profile?.org_level2 || "",
        orgLevel3: profile?.org_level3 || "",
        phoneNumber: userData.phone_number || "",
        birthdate: userData.birthdate || "",
        gender: userData.gender || "",
        createdAt: userData.created_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * PUT /api/admin/employees/[id] - 직원 정보 수정
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeUserId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    await requireAdmin(supabase);

    // 현재 관리자가 선택한 기수 확인
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    const updateData: UpdateEmployeeData = await request.json();
    const serviceClient = createServiceClient();

    // 직원이 해당 기수에 속하는지 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser, error: existingError } = await (serviceClient as any)
      .from("users")
      .select(`
        id,
        employee_id,
        profiles!inner(cohort_id)
      `)
      .eq("id", employeeUserId)
      .single();

    if (existingError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "직원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profile = existingUser.profiles?.[0] || existingUser.profiles;
    if (profile?.cohort_id !== cohortId) {
      return NextResponse.json(
        { success: false, error: "다른 기수의 직원은 수정할 수 없습니다." },
        { status: 403 }
      );
    }

    // 사번 중복 체크 (변경된 경우에만)
    if (updateData.employeeId && updateData.employeeId !== existingUser.employee_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: duplicateEmployee } = await (serviceClient as any)
        .from("users")
        .select("id")
        .eq("employee_id", updateData.employeeId)
        .neq("id", employeeUserId)
        .single();

      if (duplicateEmployee) {
        return NextResponse.json(
          { success: false, error: `사번 ${updateData.employeeId}이(가) 이미 존재합니다.` },
          { status: 400 }
        );
      }
    }

    // users 테이블 업데이트
    const userUpdateFields: Record<string, unknown> = {};
    if (updateData.name !== undefined) userUpdateFields.name = updateData.name;
    if (updateData.employeeId !== undefined) userUpdateFields.employee_id = updateData.employeeId;
    if (updateData.phoneNumber !== undefined) {
      userUpdateFields.phone_number = formatPhoneNumber(updateData.phoneNumber);
    }
    if (updateData.birthdate !== undefined) userUpdateFields.birthdate = updateData.birthdate || null;
    if (updateData.gender !== undefined) userUpdateFields.gender = updateData.gender || null;

    if (Object.keys(userUpdateFields).length > 0) {
      const { error: userUpdateError } = await serviceClient
        .from("users")
        .update(userUpdateFields)
        .eq("id", employeeUserId);

      if (userUpdateError) {
        console.error("User update error:", userUpdateError);
        return NextResponse.json(
          { success: false, error: "직원 정보 수정에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    // profiles 테이블 업데이트
    const profileUpdateFields: Record<string, unknown> = {};
    if (updateData.orgLevel1 !== undefined) {
      profileUpdateFields.org_level1 = updateData.orgLevel1;
      profileUpdateFields.department = updateData.orgLevel1; // 하위 호환성
    }
    if (updateData.orgLevel2 !== undefined) profileUpdateFields.org_level2 = updateData.orgLevel2 || null;
    if (updateData.orgLevel3 !== undefined) profileUpdateFields.org_level3 = updateData.orgLevel3 || null;

    if (Object.keys(profileUpdateFields).length > 0) {
      const { error: profileUpdateError } = await serviceClient
        .from("profiles")
        .update(profileUpdateFields)
        .eq("user_id", employeeUserId);

      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError);
        return NextResponse.json(
          { success: false, error: "부서 정보 수정에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "직원 정보가 수정되었습니다.",
    });
  } catch (error) {
    console.error("Employee update error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * DELETE /api/admin/employees/[id] - 직원 삭제
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeUserId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    await requireAdmin(supabase);

    // 현재 관리자가 선택한 기수 확인
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 직원이 해당 기수에 속하는지 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser, error: existingError } = await (serviceClient as any)
      .from("users")
      .select(`
        id,
        name,
        email,
        profiles!inner(cohort_id, role)
      `)
      .eq("id", employeeUserId)
      .single();

    if (existingError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "직원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profile = existingUser.profiles?.[0] || existingUser.profiles;

    // 관리자 계정 삭제 방지
    if (profile?.role === "admin") {
      return NextResponse.json(
        { success: false, error: "관리자 계정은 삭제할 수 없습니다." },
        { status: 403 }
      );
    }

    if (profile?.cohort_id !== cohortId) {
      return NextResponse.json(
        { success: false, error: "다른 기수의 직원은 삭제할 수 없습니다." },
        { status: 403 }
      );
    }

    // 자기 자신 삭제 방지
    if (employeeUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "자기 자신은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 관련 데이터 삭제 (순서 중요: 외래키 제약)
    // 1. profile_tags 삭제
    const { data: profileData } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("user_id", employeeUserId)
      .single();

    if (profileData) {
      await serviceClient
        .from("profile_tags")
        .delete()
        .eq("profile_id", profileData.id);
    }

    // 2. embeddings 삭제
    await serviceClient
      .from("embeddings")
      .delete()
      .eq("user_id", employeeUserId);

    // 3. preferences 삭제
    await serviceClient
      .from("preferences")
      .delete()
      .eq("user_id", employeeUserId);

    // 4. profiles 삭제
    await serviceClient
      .from("profiles")
      .delete()
      .eq("user_id", employeeUserId);

    // 5. users 테이블에서 삭제 (soft delete 대신 hard delete)
    const { error: userDeleteError } = await serviceClient
      .from("users")
      .delete()
      .eq("id", employeeUserId);

    if (userDeleteError) {
      console.error("User delete error:", userDeleteError);
      return NextResponse.json(
        { success: false, error: "직원 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 6. Supabase Auth 사용자 삭제
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(employeeUserId);

    if (authDeleteError) {
      console.error("Auth user delete error:", authDeleteError);
      // Auth 삭제 실패는 경고만 (이미 DB에서는 삭제됨)
    }

    return NextResponse.json({
      success: true,
      message: `${existingUser.name}(${existingUser.email}) 직원이 삭제되었습니다.`,
    });
  } catch (error) {
    console.error("Employee delete error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

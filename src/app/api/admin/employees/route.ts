import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import {
  validateCompanyEmail,
  generateInitialPassword,
  formatPhoneNumber,
} from "@/lib/utils/csv";
import type {
  NewEmployeeData,
  BulkRegistrationResult,
  EmployeeListItem,
} from "@/types/employee";

const MAX_EMPLOYEES_PER_REQUEST = 30;

/**
 * GET /api/admin/employees - 등록된 신입사원 목록 조회
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const orgLevel1Filter = searchParams.get("orgLevel1");

    const serviceClient = createServiceClient();

    // 사번이 있는 사용자 조회 (신입사원으로 등록된 사용자)
    let query = serviceClient
      .from("users")
      .select(
        `
        id,
        employee_id,
        name,
        email,
        phone_number,
        birthdate,
        gender,
        created_at,
        profiles!inner(org_level1, org_level2, org_level3)
      `,
        { count: "exact" }
      )
      .not("employee_id", "is", null)
      .order("created_at", { ascending: false });

    if (orgLevel1Filter) {
      query = query.eq("profiles.org_level1", orgLevel1Filter);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch employees:", error);
      return NextResponse.json(
        { success: false, error: "직원 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employees: EmployeeListItem[] = (data || []).map((user: any) => ({
      id: user.id,
      employeeId: user.employee_id,
      name: user.name,
      email: user.email,
      orgLevel1: user.profiles?.org_level1 || "",
      orgLevel2: user.profiles?.org_level2 || undefined,
      orgLevel3: user.profiles?.org_level3 || undefined,
      phoneNumber: user.phone_number || undefined,
      birthdate: user.birthdate || undefined,
      gender: user.gender || undefined,
      createdAt: user.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        employees,
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
 * POST /api/admin/employees - 신입사원 일괄 등록
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { employees } = (await request.json()) as {
      employees: NewEmployeeData[];
    };

    // 입력 검증
    if (!employees || !Array.isArray(employees)) {
      return NextResponse.json(
        { success: false, error: "employees 배열이 필요합니다." },
        { status: 400 }
      );
    }

    if (employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "최소 1명 이상의 직원 정보가 필요합니다." },
        { status: 400 }
      );
    }

    if (employees.length > MAX_EMPLOYEES_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          error: `한 번에 최대 ${MAX_EMPLOYEES_PER_REQUEST}명까지 등록 가능합니다.`,
        },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const results: BulkRegistrationResult["results"] = [];

    for (const emp of employees) {
      try {
        // 필수 필드 검증
        if (!emp.name || !emp.email || !emp.orgLevel1 || !emp.phoneNumber) {
          results.push({
            success: false,
            email: emp.email,
            name: emp.name,
            error: "필수 필드가 누락되었습니다 (이름, 이메일, 부서, 전화번호)",
          });
          continue;
        }

        // 이메일 도메인 검증
        if (!validateCompanyEmail(emp.email)) {
          results.push({
            success: false,
            email: emp.email,
            name: emp.name,
            error: "이메일은 @suresofttech.com 도메인이어야 합니다.",
          });
          continue;
        }

        // 이메일 중복 체크
        const { data: existingUser } = await serviceClient
          .from("users")
          .select("id")
          .eq("email", emp.email)
          .single();

        if (existingUser) {
          results.push({
            success: false,
            email: emp.email,
            name: emp.name,
            error: "이미 등록된 이메일입니다.",
          });
          continue;
        }

        // 사번 자동 생성
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: employeeIdResult, error: employeeIdError } =
          await (serviceClient.rpc as any)("generate_employee_id");

        if (employeeIdError || !employeeIdResult) {
          results.push({
            success: false,
            email: emp.email,
            name: emp.name,
            error: "사번 생성에 실패했습니다.",
          });
          continue;
        }

        const employeeId = employeeIdResult as string;
        const initialPassword = generateInitialPassword(emp.birthdate);

        // Supabase Auth로 사용자 생성
        const { data: authData, error: authError } =
          await serviceClient.auth.admin.createUser({
            email: emp.email,
            password: initialPassword,
            email_confirm: true, // 이메일 확인 없이 바로 활성화
            user_metadata: {
              name: emp.name,
            },
          });

        if (authError || !authData.user) {
          results.push({
            success: false,
            email: emp.email,
            name: emp.name,
            error: authError?.message || "사용자 계정 생성에 실패했습니다.",
          });
          continue;
        }

        const userId = authData.user.id;

        // users 테이블에 추가 정보 저장
        const { error: userError } = await serviceClient.from("users").insert({
          id: userId,
          email: emp.email,
          name: emp.name,
          employee_id: employeeId,
          phone_number: formatPhoneNumber(emp.phoneNumber),
          birthdate: emp.birthdate || null,
          address: emp.address || null,
          gender: emp.gender || null,
        });

        if (userError) {
          // Auth 사용자 삭제 (롤백)
          await serviceClient.auth.admin.deleteUser(userId);
          results.push({
            success: false,
            email: emp.email,
            name: emp.name,
            error: "사용자 정보 저장에 실패했습니다.",
          });
          continue;
        }

        // profiles 테이블에 초기 레코드 생성
        const { error: profileError } = await serviceClient
          .from("profiles")
          .insert({
            user_id: userId,
            org_level1: emp.orgLevel1,
            org_level2: emp.orgLevel2 || null,
            org_level3: emp.orgLevel3 || null,
            department: emp.orgLevel1, // 하위 호환성
            is_profile_complete: false,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // 프로필 생성 실패는 경고만 기록 (사용자 계정은 유지)
        }

        results.push({
          success: true,
          employeeId,
          email: emp.email,
          name: emp.name,
        });
      } catch (err) {
        console.error("Employee registration error:", err);
        results.push({
          success: false,
          email: emp.email,
          name: emp.name,
          error: "알 수 없는 오류가 발생했습니다.",
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        total: employees.length,
        successful,
        failed,
        results,
      } as BulkRegistrationResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

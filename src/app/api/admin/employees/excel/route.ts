/**
 * 등록된 직원 엑셀 다운로드 API
 * GET /api/admin/employees/excel
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";
import * as XLSX from "xlsx";

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

    await requireAdmin(supabase);

    // 현재 관리자가 선택한 기수 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // URL 파라미터에서 필터 가져오기
    const { searchParams } = new URL(request.url);
    const orgLevel1Filter = searchParams.get("orgLevel1");

    const serviceClient = createServiceClient();

    // 모든 직원 데이터 조회 (선택된 기수만)
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
        address,
        created_at,
        profiles!inner(org_level1, org_level2, org_level3, cohort_id)
      `
      )
      .not("employee_id", "is", null)
      .eq("profiles.cohort_id", cohortId)
      .order("created_at", { ascending: false });

    if (orgLevel1Filter && orgLevel1Filter !== "all") {
      query = query.eq("profiles.org_level1", orgLevel1Filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch employees for Excel:", error);
      return NextResponse.json(
        { success: false, error: "직원 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    // 기수 이름 가져오기
    const { data: cohortData } = await serviceClient
      .from("cohorts")
      .select("name")
      .eq("id", cohortId)
      .single();

    const cohortName = cohortData?.name || "기수정보없음";

    // 엑셀 데이터 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const excelData = (data || []).map((emp: any, index: number) => ({
      번호: index + 1,
      사번: emp.employee_id || "",
      이름: emp.name || "",
      이메일: emp.email || "",
      부서: emp.profiles?.org_level1 || "",
      실: emp.profiles?.org_level2 || "",
      팀: emp.profiles?.org_level3 || "",
      전화번호: emp.phone_number || "",
      생년월일: emp.birthdate || "",
      성별: formatGender(emp.gender),
      주소: emp.address || "",
      등록일: formatDate(emp.created_at),
    }));

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 열 너비 설정
    worksheet["!cols"] = [
      { wch: 5 },   // 번호
      { wch: 12 },  // 사번
      { wch: 10 },  // 이름
      { wch: 30 },  // 이메일
      { wch: 15 },  // 부서
      { wch: 15 },  // 실
      { wch: 15 },  // 팀
      { wch: 15 },  // 전화번호
      { wch: 12 },  // 생년월일
      { wch: 8 },   // 성별
      { wch: 40 },  // 주소
      { wch: 12 },  // 등록일
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "직원목록");

    // 버퍼로 변환
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 파일명 생성 (현재 날짜 포함)
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const fileName = `신입사원목록_${cohortName}_${today}.xlsx`;

    // 응답 헤더 설정 및 반환
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status =
      message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

function formatGender(gender: string | null): string {
  if (!gender) return "";
  switch (gender) {
    case "male":
      return "남성";
    case "female":
      return "여성";
    case "other":
      return "기타";
    default:
      return gender;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { parseEmployeeCSV, generateCSVTemplate } from "@/lib/utils/csv";

/**
 * POST /api/admin/employees/csv - CSV 파일 파싱
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "CSV 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "파일 크기가 1MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, error: "CSV 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const content = await file.text();
    const result = parseEmployeeCSV(content);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * GET /api/admin/employees/csv - CSV 템플릿 다운로드
 */
export async function GET() {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const template = generateCSVTemplate();

    return new NextResponse(template, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="employee_template.csv"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

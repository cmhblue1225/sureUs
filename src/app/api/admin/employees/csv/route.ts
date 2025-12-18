import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/utils/auth";
import { parseEmployeeCSV } from "@/lib/utils/csv";
import { readFileSync } from "fs";
import { join } from "path";

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

    // 정적 템플릿 파일 읽기
    const templatePath = join(process.cwd(), "신입사원_템플릿.csv");
    const template = readFileSync(templatePath, "utf-8");

    // 한글 파일명을 위한 인코딩
    const encodedFilename = encodeURIComponent("신입사원_템플릿.csv");

    return new NextResponse(template, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    const status = message.includes("인증") || message.includes("권한") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

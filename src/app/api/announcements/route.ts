import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";

// GET /api/announcements - 공지 목록
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("announcements")
      .select(
        `
        *,
        author:users!announcements_user_id_fkey(id, name, avatar_url),
        files:announcement_files(id, file_name, file_type, file_size)
      `,
        { count: "exact" }
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: announcements, error, count } = await query;

    if (error) {
      console.error("Announcements fetch error:", error);
      return NextResponse.json(
        { success: false, error: "공지사항을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: announcements,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Announcements API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/announcements - 공지 작성 (admin만)
export async function POST(request: NextRequest) {
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
        { success: false, error: "관리자만 공지를 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category, isImportant, isPinned, files } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "제목과 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 공지 생성
    const { data: announcement, error } = await supabase
      .from("announcements")
      .insert({
        user_id: user.id,
        title,
        content,
        category: category || "notice",
        is_important: isImportant || false,
        is_pinned: isPinned || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Announcement create error:", error);
      return NextResponse.json(
        { success: false, error: "공지 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 첨부파일 정보 저장
    if (files && files.length > 0) {
      const fileRecords = files.map(
        (file: { name: string; url: string; size: number; type: string }) => ({
          announcement_id: announcement.id,
          file_name: file.name,
          file_url: file.url,
          file_size: file.size,
          file_type: file.type,
        })
      );

      await supabase.from("announcement_files").insert(fileRecords);
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Announcements API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

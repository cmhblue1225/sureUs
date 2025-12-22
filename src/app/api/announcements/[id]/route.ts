import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";

// GET /api/announcements/[id] - 공지 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 조회수 증가 (RPC 함수 사용)
    try {
      await supabase.rpc("increment_announcement_view_count", { p_id: id });
    } catch {
      // RPC 오류 무시
    }

    // 공지 조회
    const { data: announcement, error } = await supabase
      .from("announcements")
      .select(
        `
        *,
        author:users!announcements_user_id_fkey(id, name, avatar_url),
        files:announcement_files(id, file_name, file_url, file_type, file_size, download_count)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "공지를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      console.error("Announcement fetch error:", error);
      return NextResponse.json(
        { success: false, error: "공지를 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 사용자 역할 확인
    const isAdmin = await checkIsAdmin(supabase);

    return NextResponse.json({
      success: true,
      data: {
        ...announcement,
        isAdmin,
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

// PUT /api/announcements/[id] - 공지 수정 (admin만)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const isAdmin = await checkIsAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자만 공지를 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category, isImportant, isPinned } = body;

    const { data: announcement, error } = await supabase
      .from("announcements")
      .update({
        title,
        content,
        category,
        is_important: isImportant,
        is_pinned: isPinned,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Announcement update error:", error);
      return NextResponse.json(
        { success: false, error: "공지 수정에 실패했습니다." },
        { status: 500 }
      );
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

// DELETE /api/announcements/[id] - 공지 삭제 (admin만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const isAdmin = await checkIsAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자만 공지를 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 관련 댓글 삭제
    const { error: commentsError } = await supabase
      .from("announcement_comments")
      .delete()
      .eq("announcement_id", id);

    if (commentsError) {
      console.error("Comments delete error:", commentsError);
    }

    // 관련 파일 삭제
    const { error: filesError } = await supabase
      .from("announcement_files")
      .delete()
      .eq("announcement_id", id);

    if (filesError) {
      console.error("Files delete error:", filesError);
    }

    // team_groupings의 announcement_id 참조 해제
    const { error: groupingsError } = await supabase
      .from("team_groupings")
      .update({ announcement_id: null })
      .eq("announcement_id", id);

    if (groupingsError) {
      console.error("Team groupings update error:", groupingsError);
    }

    // 공지 삭제
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Announcement delete error:", error);
      return NextResponse.json(
        { success: false, error: "공지 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "공지가 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Announcements API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

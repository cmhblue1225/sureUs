import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/announcements/[id]/comments - 댓글 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;
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

    const { data: comments, error } = await supabase
      .from("announcement_comments")
      .select(
        `
        *,
        author:users!announcement_comments_user_id_fkey(id, name, avatar_url)
      `
      )
      .eq("announcement_id", announcementId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json(
        { success: false, error: "댓글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/announcements/[id]/comments - 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params;
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

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "댓글 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from("announcement_comments")
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(
        `
        *,
        author:users!announcement_comments_user_id_fkey(id, name, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error("Comment create error:", error);
      return NextResponse.json(
        { success: false, error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

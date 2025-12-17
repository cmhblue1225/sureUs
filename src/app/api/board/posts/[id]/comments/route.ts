import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/board/posts/[id]/comments - 댓글 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
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
      .from("board_comments")
      .select(
        `
        *,
        author:users!board_comments_user_id_fkey(id, name, avatar_url)
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json(
        { success: false, error: "댓글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 댓글을 트리 구조로 변환
    const commentMap = new Map();
    const rootComments: typeof comments = [];

    comments?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments?.forEach((comment) => {
      const node = commentMap.get(comment.id);
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(node);
      } else {
        rootComments.push(node);
      }
    });

    return NextResponse.json({
      success: true,
      data: rootComments,
    });
  } catch (error) {
    console.error("Comments API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/board/posts/[id]/comments - 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
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
    const { content, parentId } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "댓글 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const { data: comment, error } = await supabase
      .from("board_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select(
        `
        *,
        author:users!board_comments_user_id_fkey(id, name, avatar_url)
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/board/posts/[id]/like - 좋아요 토글
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

    // 기존 좋아요 확인
    const { data: existingLike } = await supabase
      .from("board_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // 좋아요 취소
      await supabase.from("board_likes").delete().eq("id", existingLike.id);

      return NextResponse.json({
        success: true,
        data: { liked: false },
      });
    } else {
      // 좋아요 추가
      await supabase.from("board_likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      return NextResponse.json({
        success: true,
        data: { liked: true },
      });
    }
  } catch (error) {
    console.error("Like API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

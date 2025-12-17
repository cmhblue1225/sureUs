import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/board/posts/[id] - 게시물 상세
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
      await supabase.rpc("increment_board_post_view_count", { p_id: id });
    } catch {
      // RPC 오류 무시
    }

    // 게시물 조회
    const { data: post, error } = await supabase
      .from("board_posts")
      .select(
        `
        *,
        author:users!board_posts_user_id_fkey(id, name, avatar_url)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "게시물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      console.error("Board post fetch error:", error);
      return NextResponse.json(
        { success: false, error: "게시물을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 좋아요 여부
    const { data: like } = await supabase
      .from("board_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .single();

    // 투표 데이터
    let pollData = null;
    let userVote = null;

    if (post.post_type === "poll") {
      const { data: poll } = await supabase
        .from("board_polls")
        .select("*")
        .eq("post_id", id)
        .single();

      if (poll) {
        pollData = poll;

        const { data: vote } = await supabase
          .from("board_poll_votes")
          .select("option_ids")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id)
          .single();

        userVote = vote?.option_ids || null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        isLiked: !!like,
        isAuthor: post.user_id === user.id,
        poll: pollData,
        userVote,
      },
    });
  } catch (error) {
    console.error("Board API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/board/posts/[id] - 게시물 수정
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

    // 권한 확인
    const { data: existingPost } = await supabase
      .from("board_posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, imageUrls } = body;

    const { data: post, error } = await supabase
      .from("board_posts")
      .update({
        title,
        content,
        image_urls: imageUrls,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Board post update error:", error);
      return NextResponse.json(
        { success: false, error: "게시물 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Board API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/board/posts/[id] - 게시물 삭제
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

    // 권한 확인
    const { data: existingPost } = await supabase
      .from("board_posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("board_posts").delete().eq("id", id);

    if (error) {
      console.error("Board post delete error:", error);
      return NextResponse.json(
        { success: false, error: "게시물 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "게시물이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Board API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

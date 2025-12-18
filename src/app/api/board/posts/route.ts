import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

// GET /api/board/posts - 게시물 목록
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
    const postType = searchParams.get("type"); // general | gallery | poll
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    let query = supabase
      .from("board_posts")
      .select(
        `
        *,
        author:users!board_posts_user_id_fkey(id, name, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("cohort_id", cohortId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postType && postType !== "all") {
      query = query.eq("post_type", postType);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Board posts fetch error:", error);
      return NextResponse.json(
        { success: false, error: "게시물을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 현재 사용자의 좋아요 여부 확인
    const postIds = posts?.map((p) => p.id) || [];
    let userLikes: string[] = [];

    if (postIds.length > 0) {
      const { data: likes } = await supabase
        .from("board_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      userLikes = likes?.map((l) => l.post_id) || [];
    }

    const postsWithLikeStatus = posts?.map((post) => ({
      ...post,
      isLiked: userLikes.includes(post.id),
    }));

    return NextResponse.json({
      success: true,
      data: postsWithLikeStatus,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
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

// POST /api/board/posts - 게시물 작성
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

    const body = await request.json();
    const { title, content, postType, imageUrls, poll } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "제목과 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 게시물 생성
    const { data: post, error: postError } = await supabase
      .from("board_posts")
      .insert({
        user_id: user.id,
        title,
        content,
        post_type: postType || "general",
        image_urls: imageUrls || [],
        cohort_id: cohortId,
      })
      .select()
      .single();

    if (postError) {
      console.error("Board post create error:", postError);
      return NextResponse.json(
        { success: false, error: "게시물 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 투표 게시물인 경우 투표 데이터 생성
    if (postType === "poll" && poll) {
      const { error: pollError } = await supabase.from("board_polls").insert({
        post_id: post.id,
        options: poll.options.map((opt: string, idx: number) => ({
          id: idx.toString(),
          text: opt,
          count: 0,
        })),
        multiple_choice: poll.multipleChoice || false,
        ends_at: poll.endsAt || null,
      });

      if (pollError) {
        console.error("Poll create error:", pollError);
        // 게시물은 생성되었으므로 경고만
      }
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

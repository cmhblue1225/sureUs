import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; postId: string }>;
}

// POST /api/clubs/[id]/posts/[postId]/like - 좋아요 토글
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId, postId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 좋아요를 할 수 있습니다." },
        { status: 403 }
      );
    }

    // Check post exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (serviceClient
      .from("club_posts")
      .select("id, like_count")
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if already liked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingLike } = await (serviceClient
      .from("club_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single() as any);

    let isLiked: boolean;
    let newLikeCount: number;

    if (existingLike) {
      // Unlike
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient
        .from("club_likes") as any)
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      isLiked = false;
      newLikeCount = Math.max(0, (post.like_count || 0) - 1);
    } else {
      // Like
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient
        .from("club_likes") as any)
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      isLiked = true;
      newLikeCount = (post.like_count || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        isLiked,
        likeCount: newLikeCount,
      },
    });
  } catch (error) {
    console.error("Like API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

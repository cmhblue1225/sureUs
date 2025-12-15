import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; postId: string }>;
}

// GET /api/clubs/[id]/posts/[postId] - 게시물 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
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
      .select("id, role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 게시물을 볼 수 있습니다." },
        { status: 403 }
      );
    }

    // Get post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (serviceClient
      .from("club_posts")
      .select(`
        *,
        author:users!club_posts_author_id_fkey(id, name, avatar_url)
      `)
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if user liked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: like } = await (serviceClient
      .from("club_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single() as any);

    // Get poll data if poll type
    let pollData = null;
    if (post.type === "poll") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: poll } = await (serviceClient
        .from("club_polls")
        .select("*")
        .eq("post_id", postId)
        .single() as any);

      if (poll) {
        // Get user's vote
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: userVote } = await (serviceClient
          .from("club_poll_votes")
          .select("option_indexes")
          .eq("poll_id", poll.id)
          .eq("user_id", user.id)
          .single() as any);

        // Get vote counts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: allVotes } = await (serviceClient
          .from("club_poll_votes")
          .select("option_indexes")
          .eq("poll_id", poll.id) as any);

        // Count votes per option
        const voteCounts: Record<number, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allVotes?.forEach((vote: any) => {
          vote.option_indexes?.forEach((idx: number) => {
            voteCounts[idx] = (voteCounts[idx] || 0) + 1;
          });
        });

        pollData = {
          ...poll,
          voteCounts,
          totalVotes: allVotes?.length || 0,
          userVote: userVote?.option_indexes || null,
          hasVoted: !!userVote,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        isLiked: !!like,
        isAuthor: post.author_id === user.id,
        isLeader: membership.role === "leader",
        pollData,
      },
    });
  } catch (error) {
    console.error("Post detail API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/clubs/[id]/posts/[postId] - 게시물 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Get post and check ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (serviceClient
      .from("club_posts")
      .select("author_id, type")
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check membership and role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 게시물을 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    // Only author or leader can edit
    if (post.author_id !== user.id && membership.role !== "leader") {
      return NextResponse.json(
        { success: false, error: "게시물 수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, imageUrls, isPinned } = body;

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (imageUrls !== undefined) updateData.image_urls = imageUrls;

    // Only leader can pin/unpin
    if (isPinned !== undefined && membership.role === "leader") {
      updateData.is_pinned = isPinned;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedPost, error: updateError } = await (serviceClient
      .from("club_posts") as any)
      .update(updateData)
      .eq("id", postId)
      .select(`
        *,
        author:users!club_posts_author_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (updateError) {
      console.error("Post update error:", updateError);
      return NextResponse.json(
        { success: false, error: "게시물 수정 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    console.error("Post update API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/posts/[postId] - 게시물 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Get post and check ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (serviceClient
      .from("club_posts")
      .select("author_id")
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check membership and role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "동호회 회원만 게시물을 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // Only author or leader can delete
    if (post.author_id !== user.id && membership.role !== "leader") {
      return NextResponse.json(
        { success: false, error: "게시물 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // Delete post (cascade will handle comments, likes, polls, votes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceClient
      .from("club_posts") as any)
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Post delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: "게시물 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "게시물이 삭제되었습니다." },
    });
  } catch (error) {
    console.error("Post delete API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

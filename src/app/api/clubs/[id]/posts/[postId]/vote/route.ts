import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; postId: string }>;
}

// POST /api/clubs/[id]/posts/[postId]/vote - 투표 참여/변경
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
        { success: false, error: "동호회 회원만 투표할 수 있습니다." },
        { status: 403 }
      );
    }

    // Get post and poll data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (serviceClient
      .from("club_posts")
      .select("id, type")
      .eq("id", postId)
      .eq("club_id", clubId)
      .single() as any);

    if (!post || post.type !== "poll") {
      return NextResponse.json(
        { success: false, error: "투표 게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get poll
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: poll } = await (serviceClient
      .from("club_polls")
      .select("*")
      .eq("post_id", postId)
      .single() as any);

    if (!poll) {
      return NextResponse.json(
        { success: false, error: "투표 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if poll is closed
    if (poll.is_closed) {
      return NextResponse.json(
        { success: false, error: "종료된 투표입니다." },
        { status: 400 }
      );
    }

    // Check end date
    if (poll.end_date && new Date(poll.end_date) < new Date()) {
      return NextResponse.json(
        { success: false, error: "투표 기간이 종료되었습니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { optionIndexes } = body;

    // Validate optionIndexes
    if (!Array.isArray(optionIndexes) || optionIndexes.length === 0) {
      return NextResponse.json(
        { success: false, error: "하나 이상의 옵션을 선택해야 합니다." },
        { status: 400 }
      );
    }

    // Check allow_multiple
    if (!poll.allow_multiple && optionIndexes.length > 1) {
      return NextResponse.json(
        { success: false, error: "이 투표는 하나의 옵션만 선택할 수 있습니다." },
        { status: 400 }
      );
    }

    // Validate option indexes are valid
    const maxIndex = (poll.options as string[]).length - 1;
    for (const idx of optionIndexes) {
      if (typeof idx !== "number" || idx < 0 || idx > maxIndex) {
        return NextResponse.json(
          { success: false, error: "유효하지 않은 옵션입니다." },
          { status: 400 }
        );
      }
    }

    // Check existing vote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingVote } = await (serviceClient
      .from("club_poll_votes")
      .select("id")
      .eq("poll_id", poll.id)
      .eq("user_id", user.id)
      .single() as any);

    if (existingVote) {
      // Update existing vote
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient
        .from("club_poll_votes") as any)
        .update({ option_indexes: optionIndexes })
        .eq("id", existingVote.id);
    } else {
      // Create new vote
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient
        .from("club_poll_votes") as any)
        .insert({
          poll_id: poll.id,
          user_id: user.id,
          option_indexes: optionIndexes,
        });
    }

    // Get updated vote counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allVotes } = await (serviceClient
      .from("club_poll_votes")
      .select("option_indexes")
      .eq("poll_id", poll.id) as any);

    // Calculate vote counts per option
    const voteCounts: Record<number, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allVotes?.forEach((vote: any) => {
      vote.option_indexes?.forEach((idx: number) => {
        voteCounts[idx] = (voteCounts[idx] || 0) + 1;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        voteCounts,
        totalVotes: allVotes?.length || 0,
        userVote: optionIndexes,
        hasVoted: true,
      },
    });
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/posts/[postId]/vote - 투표 취소
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

    // Get poll
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: poll } = await (serviceClient
      .from("club_polls")
      .select("id, is_closed, end_date")
      .eq("post_id", postId)
      .single() as any);

    if (!poll) {
      return NextResponse.json(
        { success: false, error: "투표를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Check if poll is closed
    if (poll.is_closed || (poll.end_date && new Date(poll.end_date) < new Date())) {
      return NextResponse.json(
        { success: false, error: "종료된 투표는 취소할 수 없습니다." },
        { status: 400 }
      );
    }

    // Delete vote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceClient
      .from("club_poll_votes") as any)
      .delete()
      .eq("poll_id", poll.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Vote delete error:", deleteError);
      return NextResponse.json(
        { success: false, error: "투표 취소 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // Get updated vote counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allVotes } = await (serviceClient
      .from("club_poll_votes")
      .select("option_indexes")
      .eq("poll_id", poll.id) as any);

    // Calculate vote counts per option
    const voteCounts: Record<number, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allVotes?.forEach((vote: any) => {
      vote.option_indexes?.forEach((idx: number) => {
        voteCounts[idx] = (voteCounts[idx] || 0) + 1;
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        voteCounts,
        totalVotes: allVotes?.length || 0,
        userVote: null,
        hasVoted: false,
      },
    });
  } catch (error) {
    console.error("Vote cancel API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

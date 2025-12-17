import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/board/posts/[id]/vote - 투표 참여
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
    const { optionIds } = body;

    if (!optionIds || optionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "투표할 옵션을 선택해주세요." },
        { status: 400 }
      );
    }

    // 투표 정보 조회
    const { data: poll, error: pollError } = await supabase
      .from("board_polls")
      .select("*")
      .eq("post_id", postId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { success: false, error: "투표를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 마감 확인
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "투표가 마감되었습니다." },
        { status: 400 }
      );
    }

    // 다중 선택 확인
    if (!poll.multiple_choice && optionIds.length > 1) {
      return NextResponse.json(
        { success: false, error: "하나의 옵션만 선택할 수 있습니다." },
        { status: 400 }
      );
    }

    // 기존 투표 확인
    const { data: existingVote } = await supabase
      .from("board_poll_votes")
      .select("id, option_ids")
      .eq("poll_id", poll.id)
      .eq("user_id", user.id)
      .single();

    // 투표 옵션 카운트 업데이트 준비
    const options = poll.options as { id: string; text: string; count: number }[];

    if (existingVote) {
      // 기존 투표가 있으면 카운트 감소
      existingVote.option_ids.forEach((optId: string) => {
        const opt = options.find((o) => o.id === optId);
        if (opt) opt.count = Math.max(0, opt.count - 1);
      });

      // 투표 업데이트
      await supabase
        .from("board_poll_votes")
        .update({ option_ids: optionIds })
        .eq("id", existingVote.id);
    } else {
      // 새 투표 생성
      await supabase.from("board_poll_votes").insert({
        poll_id: poll.id,
        user_id: user.id,
        option_ids: optionIds,
      });
    }

    // 새 투표 카운트 증가
    optionIds.forEach((optId: string) => {
      const opt = options.find((o) => o.id === optId);
      if (opt) opt.count += 1;
    });

    // 옵션 카운트 업데이트
    await supabase.from("board_polls").update({ options }).eq("id", poll.id);

    return NextResponse.json({
      success: true,
      data: {
        options,
        userVote: optionIds,
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

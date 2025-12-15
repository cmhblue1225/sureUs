import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; requestId: string }>;
}

// PATCH /api/clubs/[id]/requests/[requestId] - 가입 신청 승인/거절 (회장만)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId, requestId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if user is leader
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (serviceClient
      .from("clubs")
      .select("leader_id")
      .eq("id", clubId)
      .single() as any);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (club.leader_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "회장만 가입 신청을 처리할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body; // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    // Get request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: joinRequest, error: requestError } = await (serviceClient
      .from("club_join_requests")
      .select("id, user_id, status")
      .eq("id", requestId)
      .eq("club_id", clubId)
      .single() as any);

    if (requestError || !joinRequest) {
      return NextResponse.json(
        { success: false, error: "가입 신청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (joinRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "이미 처리된 신청입니다." },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update request status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (serviceClient
      .from("club_join_requests") as any)
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Request update error:", updateError);
      return NextResponse.json(
        { success: false, error: "처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // If approved, add as member
    if (action === "approve") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: memberError } = await (serviceClient
        .from("club_members") as any)
        .insert({
          club_id: clubId,
          user_id: joinRequest.user_id,
          role: "member",
          status: "active",
        });

      if (memberError) {
        console.error("Member add error:", memberError);
        // Rollback request status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient
          .from("club_join_requests") as any)
          .update({ status: "pending", reviewed_by: null, reviewed_at: null })
          .eq("id", requestId);

        return NextResponse.json(
          { success: false, error: "회원 추가 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: action === "approve" ? "가입이 승인되었습니다." : "가입이 거절되었습니다.",
        status: newStatus,
      },
    });
  } catch (error) {
    console.error("Request action API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

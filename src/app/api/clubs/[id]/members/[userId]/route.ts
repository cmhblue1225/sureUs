import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

// DELETE /api/clubs/[id]/members/[userId] - 회원 강퇴 (회장만)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId, userId: targetUserId } = await params;
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
        { success: false, error: "회장만 회원을 강퇴할 수 있습니다." },
        { status: 403 }
      );
    }

    // Cannot kick yourself (leader)
    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "자신을 강퇴할 수 없습니다." },
        { status: 400 }
      );
    }

    // Check if target is a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (serviceClient
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .single() as any);

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "해당 회원을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Remove member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceClient
      .from("club_members") as any)
      .delete()
      .eq("id", membership.id);

    if (deleteError) {
      console.error("Kick error:", deleteError);
      return NextResponse.json(
        { success: false, error: "강퇴 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "회원이 강퇴되었습니다." },
    });
  } catch (error) {
    console.error("Kick API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

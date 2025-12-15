import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/clubs/[id]/leave - 동호회 탈퇴
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check if user is a member
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
        { success: false, error: "가입되어 있지 않은 동호회입니다." },
        { status: 400 }
      );
    }

    // Leader cannot leave (must transfer or delete club)
    if (membership.role === "leader") {
      return NextResponse.json(
        { success: false, error: "회장은 탈퇴할 수 없습니다. 동호회를 삭제하거나 회장을 위임해주세요." },
        { status: 400 }
      );
    }

    // Remove membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceClient
      .from("club_members") as any)
      .delete()
      .eq("id", membership.id);

    if (deleteError) {
      console.error("Leave error:", deleteError);
      return NextResponse.json(
        { success: false, error: "탈퇴 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "동호회에서 탈퇴했습니다." },
    });
  } catch (error) {
    console.error("Leave API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

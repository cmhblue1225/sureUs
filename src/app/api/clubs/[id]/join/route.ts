import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/clubs/[id]/join - 동호회 가입 또는 가입 신청
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get club info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club, error: clubError } = await (serviceClient
      .from("clubs")
      .select("id, name, join_policy, leader_id, is_active")
      .eq("id", clubId)
      .single() as any) as { data: { id: string; name: string; join_policy: string; leader_id: string; is_active: boolean } | null; error: unknown };

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!club.is_active) {
      return NextResponse.json(
        { success: false, error: "비활성화된 동호회입니다." },
        { status: 400 }
      );
    }

    // Check if already a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingMember } = await (serviceClient
      .from("club_members")
      .select("id, status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single() as any);

    if (existingMember) {
      if (existingMember.status === "active") {
        return NextResponse.json(
          { success: false, error: "이미 가입된 동호회입니다." },
          { status: 400 }
        );
      }
      // Reactivate if inactive
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient
        .from("club_members") as any)
        .update({ status: "active", joined_at: new Date().toISOString() })
        .eq("id", existingMember.id);

      return NextResponse.json({
        success: true,
        data: { message: "동호회에 다시 가입되었습니다.", joined: true },
      });
    }

    // Parse body for message (optional)
    let message = null;
    try {
      const body = await request.json();
      message = body.message;
    } catch {
      // No body is fine
    }

    // Handle based on join policy
    if (club.join_policy === "public") {
      // Direct join
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: joinError } = await (serviceClient
        .from("club_members") as any)
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: "member",
          status: "active",
        });

      if (joinError) {
        console.error("Join error:", joinError);
        return NextResponse.json(
          { success: false, error: "가입 처리 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { message: "동호회에 가입되었습니다.", joined: true },
      });
    } else {
      // Approval required - create join request
      // Check for existing pending request
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingRequest } = await (serviceClient
        .from("club_join_requests")
        .select("id, status")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single() as any);

      if (existingRequest) {
        return NextResponse.json(
          { success: false, error: "이미 가입 신청 중입니다." },
          { status: 400 }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: requestError } = await (serviceClient
        .from("club_join_requests") as any)
        .insert({
          club_id: clubId,
          user_id: user.id,
          message: message || null,
          status: "pending",
        });

      if (requestError) {
        console.error("Request error:", requestError);
        return NextResponse.json(
          { success: false, error: "가입 신청 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { message: "가입 신청이 완료되었습니다. 회장의 승인을 기다려주세요.", joined: false, requested: true },
      });
    }
  } catch (error) {
    console.error("Join API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/join - 가입 신청 취소
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

    // Get pending request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingRequest } = await (serviceClient
      .from("club_join_requests")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single() as any);

    if (!pendingRequest) {
      return NextResponse.json(
        { success: false, error: "대기 중인 가입 신청이 없습니다." },
        { status: 404 }
      );
    }

    // Delete the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (serviceClient
      .from("club_join_requests") as any)
      .delete()
      .eq("id", pendingRequest.id);

    if (deleteError) {
      console.error("Delete request error:", deleteError);
      return NextResponse.json(
        { success: false, error: "신청 취소 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "가입 신청이 취소되었습니다." },
    });
  } catch (error) {
    console.error("Cancel join request API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

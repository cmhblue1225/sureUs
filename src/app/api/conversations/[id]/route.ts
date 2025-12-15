import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations/[id] - Get conversation details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get conversation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversation, error } = await (supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .single() as any);

    if (error || !conversation) {
      return NextResponse.json(
        { success: false, error: "대화를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get other user info
    const otherUserId = conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1;

    const { data: otherUser } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("id", otherUserId)
      .single<{ id: string; name: string; avatar_url?: string }>();

    // Get other user's profile for department
    const { data: otherProfile } = await supabase
      .from("profiles")
      .select("department, job_role")
      .eq("user_id", otherUserId)
      .single<{ department?: string; job_role?: string }>();

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        otherUser: otherUser ? {
          ...otherUser,
          department: otherProfile?.department,
          jobRole: otherProfile?.job_role,
        } : { id: otherUserId, name: "알 수 없음" },
        createdAt: conversation.created_at,
      },
    });
  } catch (error) {
    console.error("Conversation API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

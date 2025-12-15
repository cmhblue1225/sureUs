import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clubs/[id]/chat - 채팅 메시지 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: "동호회 회원만 채팅을 볼 수 있습니다." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const before = searchParams.get("before"); // cursor for pagination
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (serviceClient
      .from("club_chat_messages")
      .select(`
        *,
        sender:users!club_chat_messages_sender_id_fkey(id, name, avatar_url)
      `)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .limit(limit) as any);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error("Messages fetch error:", messagesError);
      return NextResponse.json(
        { success: false, error: "메시지를 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Reverse to show oldest first
    const sortedMessages = messages?.reverse() || [];

    return NextResponse.json({
      success: true,
      data: {
        messages: sortedMessages,
        hasMore: messages?.length === limit,
        cursor: messages?.[0]?.created_at || null,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[id]/chat - 메시지 전송
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
        { success: false, error: "동호회 회원만 메시지를 보낼 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, type } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { success: false, error: "메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    // Only leader can send announcements
    const messageType = type || "message";
    if (messageType === "announcement" && membership.role !== "leader") {
      return NextResponse.json(
        { success: false, error: "회장만 공지를 보낼 수 있습니다." },
        { status: 403 }
      );
    }

    // Create message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: message, error: messageError } = await (serviceClient
      .from("club_chat_messages") as any)
      .insert({
        club_id: clubId,
        sender_id: user.id,
        content: content.trim(),
        type: messageType,
      })
      .select(`
        *,
        sender:users!club_chat_messages_sender_id_fkey(id, name, avatar_url)
      `)
      .single();

    if (messageError) {
      console.error("Message create error:", messageError);
      return NextResponse.json(
        { success: false, error: "메시지 전송 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Chat send API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

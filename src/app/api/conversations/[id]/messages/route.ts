import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// GET /api/conversations/[id]/messages - Get messages in conversation
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

    // Verify user is participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversation } = await (supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .single() as any);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "대화를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // cursor for pagination

    // Get messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("messages") as any)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Messages fetch error:", error);
      return NextResponse.json(
        { success: false, error: "메시지를 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Mark unread messages from other user as read
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("messages") as any)
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("read", false);

    return NextResponse.json({
      success: true,
      data: {
        messages: (messages || []).reverse(), // Return in chronological order
        hasMore: messages?.length === limit,
      },
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
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

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "메시지 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // Verify user is participant and get other user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversation } = await (supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .single() as any);

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "대화를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Insert message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: message, error: messageError } = await (supabase.from("messages") as any)
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (messageError) {
      console.error("Message insert error:", messageError);
      return NextResponse.json(
        { success: false, error: "메시지를 보낼 수 없습니다." },
        { status: 500 }
      );
    }

    // Update conversation last_message_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("conversations") as any)
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Create notification for the other user
    const otherUserId = conversation.participant_1 === user.id
      ? conversation.participant_2
      : conversation.participant_1;

    try {
      const serviceClient = createServiceClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Get sender's name
      const { data: senderData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single<{ name: string }>();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient.from("notifications") as any).insert({
        user_id: otherUserId,
        type: "new_message",
        title: `${senderData?.name || "누군가"}님의 새 메시지`,
        body: content.length > 50 ? content.substring(0, 50) + "..." : content,
        data: {
          conversationId,
          senderId: user.id,
          senderName: senderData?.name,
        },
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

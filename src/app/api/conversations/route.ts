import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveCohortId, isUserAdmin, isSameCohort } from "@/lib/utils/cohort";

// GET /api/conversations - Get user's conversations
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // Get conversations where user is participant and in the same cohort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: conversations, error } = await (supabase
      .from("conversations")
      .select("*")
      .eq("cohort_id", cohortId)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false }) as any);

    if (error) {
      console.error("Conversations fetch error:", error);
      return NextResponse.json(
        { success: false, error: "대화 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Get other participants' info and unread counts
    const conversationsWithDetails = await Promise.all(
      (conversations || []).map(async (conv: {
        id: string;
        participant_1: string;
        participant_2: string;
        last_message_at: string;
        created_at: string;
      }) => {
        const otherUserId = conv.participant_1 === user.id
          ? conv.participant_2
          : conv.participant_1;

        // Get other user info
        const { data: otherUser } = await supabase
          .from("users")
          .select("id, name, avatar_url")
          .eq("id", otherUserId)
          .single();

        // Get unread count
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: unreadCount } = await (supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("read", false)
          .neq("sender_id", user.id) as any);

        // Get last message
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: lastMessage } = await (supabase
          .from("messages")
          .select("content, sender_id, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single() as any);

        return {
          id: conv.id,
          otherUser: otherUser || { id: otherUserId, name: "알 수 없음" },
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
          lastMessageAt: conv.last_message_at,
          createdAt: conv.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: conversationsWithDetails,
    });
  } catch (error) {
    console.error("Conversations API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { otherUserId } = body;

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, error: "상대방 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (otherUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "자기 자신과 대화할 수 없습니다." },
        { status: 400 }
      );
    }

    // 같은 기수인지 확인
    const sameCoho = await isSameCohort(supabase, user.id, otherUserId);
    if (!sameCoho) {
      return NextResponse.json(
        { success: false, error: "같은 기수의 사용자에게만 메시지를 보낼 수 있습니다." },
        { status: 400 }
      );
    }

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingConv } = await (supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
      )
      .single() as any);

    if (existingConv) {
      return NextResponse.json({
        success: true,
        data: { conversationId: existingConv.id, isNew: false },
      });
    }

    // Create new conversation
    // Sort IDs to ensure consistent ordering
    const [p1, p2] = [user.id, otherUserId].sort();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newConv, error: createError } = await (supabase.from("conversations") as any)
      .insert({
        participant_1: p1,
        participant_2: p2,
        cohort_id: cohortId,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Conversation create error:", createError);
      return NextResponse.json(
        { success: false, error: "대화를 생성할 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { conversationId: newConv.id, isNew: true },
    });
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

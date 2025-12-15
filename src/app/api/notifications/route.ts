import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("read", false);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: notifications, error } = await (query as any);

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json(
        { success: false, error: "알림을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Get unread count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: unreadCount } = await (supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false) as any);

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
      },
    });
  } catch (error) {
    console.error("Notifications API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
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
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("notifications") as any)
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Mark all read error:", error);
        return NextResponse.json(
          { success: false, error: "알림 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("notifications") as any)
        .update({ read: true })
        .eq("user_id", user.id)
        .in("id", notificationIds);

      if (error) {
        console.error("Mark read error:", error);
        return NextResponse.json(
          { success: false, error: "알림 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "알림이 읽음 처리되었습니다.",
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (notificationId) {
      // Delete specific notification
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("notifications") as any)
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Delete notification error:", error);
        return NextResponse.json(
          { success: false, error: "알림 삭제에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "알림이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Notifications DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

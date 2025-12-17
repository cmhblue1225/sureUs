import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";

// GET /api/calendar/[id] - 일정 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: event, error } = await supabase
      .from("calendar_events")
      .select(
        `
        *,
        creator:users!calendar_events_created_by_fkey(id, name, avatar_url)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "일정을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      console.error("Calendar event fetch error:", error);
      return NextResponse.json(
        { success: false, error: "일정을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/[id] - 일정 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 기존 이벤트 조회
    const { data: existingEvent, error: fetchError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json(
        { success: false, error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    if (existingEvent.event_type === "training") {
      const isAdmin = await checkIsAdmin(supabase);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "교육 일정은 관리자만 수정할 수 있습니다." },
          { status: 403 }
        );
      }
    } else if (existingEvent.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "본인의 일정만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startDate, endDate, allDay, location, color } =
      body;

    const { data: event, error } = await supabase
      .from("calendar_events")
      .update({
        title: title ?? existingEvent.title,
        description: description ?? existingEvent.description,
        start_date: startDate ?? existingEvent.start_date,
        end_date: endDate ?? existingEvent.end_date,
        all_day: allDay ?? existingEvent.all_day,
        location: location ?? existingEvent.location,
        color: color ?? existingEvent.color,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Calendar event update error:", error);
      return NextResponse.json(
        { success: false, error: "일정 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/[id] - 일정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 기존 이벤트 조회
    const { data: existingEvent, error: fetchError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json(
        { success: false, error: "일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    if (existingEvent.event_type === "training") {
      const isAdmin = await checkIsAdmin(supabase);
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "교육 일정은 관리자만 삭제할 수 있습니다." },
          { status: 403 }
        );
      }
    } else if (existingEvent.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "본인의 일정만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Calendar event delete error:", error);
      return NextResponse.json(
        { success: false, error: "일정 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "일정이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

// GET /api/calendar - 일정 목록 조회
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const eventType = searchParams.get("eventType"); // training | personal | all

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // training 이벤트: 기수 필터
    // personal 이벤트: 본인 것만
    let query = supabase
      .from("calendar_events")
      .select(
        `
        *,
        creator:users!calendar_events_created_by_fkey(id, name, avatar_url)
      `
      )
      .order("start_date", { ascending: true });

    // 날짜 필터
    if (startDate) {
      query = query.gte("start_date", startDate);
    }
    if (endDate) {
      query = query.lte("end_date", endDate);
    }

    // 이벤트 타입 필터
    if (eventType === "training") {
      query = query.eq("event_type", "training").eq("cohort_id", cohortId);
    } else if (eventType === "personal") {
      query = query.eq("event_type", "personal").eq("user_id", user.id);
    } else {
      // all: training은 기수별, personal은 본인 것만
      query = query.or(
        `and(event_type.eq.training,cohort_id.eq.${cohortId}),and(event_type.eq.personal,user_id.eq.${user.id})`
      );
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Calendar events fetch error:", error);
      return NextResponse.json(
        { success: false, error: "일정을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/calendar - 일정 생성
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      eventType,
      location,
      color,
    } = body;

    // 필수 필드 검증
    if (!title || !startDate || !endDate || !eventType) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // training 이벤트는 admin만 생성 가능
    const isAdmin = await checkIsAdmin(supabase);
    if (eventType === "training" && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "교육 일정은 관리자만 생성할 수 있습니다." },
        { status: 403 }
      );
    }

    // 현재 사용자의 기수 ID 가져오기
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert({
        title,
        description: description || null,
        start_date: startDate,
        end_date: endDate,
        all_day: allDay || false,
        event_type: eventType,
        user_id: eventType === "personal" ? user.id : null,
        created_by: user.id,
        location: location || null,
        color: color || "#3B82F6",
        cohort_id: cohortId,
      })
      .select()
      .single();

    if (error) {
      console.error("Calendar event create error:", error);
      return NextResponse.json(
        { success: false, error: "일정 생성에 실패했습니다." },
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

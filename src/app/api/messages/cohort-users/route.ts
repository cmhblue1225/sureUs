import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

// GET /api/messages/cohort-users - Get users in the same cohort
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

    // Get search query parameter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    // Get current user's effective cohort ID
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // Get all users in the same cohort (excluding current user)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        user_id,
        department,
        job_role,
        users!inner (
          id,
          name,
          email,
          avatar_url,
          deleted_at
        )
      `)
      .eq("cohort_id", cohortId)
      .neq("user_id", user.id);

    if (error) {
      console.error("Cohort users fetch error:", error);
      return NextResponse.json(
        { success: false, error: "사용자 목록을 불러올 수 없습니다." },
        { status: 500 }
      );
    }

    // Transform and filter results
    const users = (profiles || [])
      .map((profile) => {
        const userInfo = profile.users as unknown as {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          deleted_at: string | null;
        };
        return {
          id: userInfo.id,
          name: userInfo.name || "이름 없음",
          email: userInfo.email,
          avatar_url: userInfo.avatar_url,
          department: profile.department,
          job_role: profile.job_role,
          deleted_at: userInfo.deleted_at,
        };
      })
      .filter((u) => {
        // Filter out deleted users
        if (u.deleted_at) return false;
        if (!search) return true;
        const nameMatch = u.name?.toLowerCase().includes(search);
        const deptMatch = u.department?.toLowerCase().includes(search);
        const emailMatch = u.email?.toLowerCase().includes(search);
        return nameMatch || deptMatch || emailMatch;
      })
      .map(({ deleted_at, ...user }) => user) // Remove deleted_at from response
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Cohort users API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

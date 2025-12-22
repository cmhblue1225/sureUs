import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/utils/auth";
import { getEffectiveCohortId } from "@/lib/utils/cohort";
import { generateTeamsWithAI, createAITeamGroupingResult } from "@/lib/team-grouping/aiGrouping";
import type { TeamMember, GenerateTeamsRequest } from "@/lib/team-grouping/types";
import type { Json } from "@/types/database";

/**
 * POST /api/team-grouping/generate
 *
 * 조 편성 생성 API (관리자 전용)
 */
export async function POST(request: Request) {
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

    // 관리자 권한 확인
    const isAdmin = await checkIsAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body: GenerateTeamsRequest = await request.json();
    const { criteriaText, teamSize } = body;

    if (!criteriaText || typeof criteriaText !== "string") {
      return NextResponse.json(
        { success: false, error: "조 편성 기준을 입력해주세요." },
        { status: 400 }
      );
    }

    if (!teamSize || teamSize < 2 || teamSize > 20) {
      return NextResponse.json(
        { success: false, error: "팀 인원은 2-20명 사이로 설정해주세요." },
        { status: 400 }
      );
    }

    // 기수 ID 가져오기
    const cohortId = await getEffectiveCohortId(supabase, user.id, true);
    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 기수 멤버 조회 (관리자 제외)
    const serviceClient = createServiceClient();
    const { data: profiles, error: profilesError } = await serviceClient
      .from("profiles")
      .select(
        `
        id,
        user_id,
        department,
        job_role,
        office_location,
        mbti,
        role,
        users!inner(id, name, email, avatar_url, deleted_at)
      `
      )
      .eq("cohort_id", cohortId)
      .eq("is_profile_complete", true)
      .is("users.deleted_at", null);

    // 관리자 제외 (role이 admin이거나 이메일이 admin@test.com인 경우)
    const nonAdminProfiles = (profiles || []).filter((p) => {
      const userData = p.users as { email: string };
      return p.role !== "admin" && userData.email !== "admin@test.com";
    });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { success: false, error: "멤버 정보를 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (nonAdminProfiles.length < teamSize) {
      return NextResponse.json(
        {
          success: false,
          error: `최소 ${teamSize}명 이상의 멤버가 필요합니다. 현재 ${nonAdminProfiles.length}명 (관리자 제외)`,
        },
        { status: 400 }
      );
    }

    // 프로필 태그 조회
    const profileIds = nonAdminProfiles.map((p) => p.id);
    const { data: allTags } = await serviceClient
      .from("profile_tags")
      .select("profile_id, tag_name")
      .in("profile_id", profileIds);

    // 태그 매핑
    const tagsByProfileId = new Map<string, string[]>();
    (allTags || []).forEach((t: { profile_id: string; tag_name: string }) => {
      const tags = tagsByProfileId.get(t.profile_id) || [];
      tags.push(t.tag_name);
      tagsByProfileId.set(t.profile_id, tags);
    });

    // TeamMember 형식으로 변환
    const members: TeamMember[] = nonAdminProfiles.map((p) => {
      const userData = p.users as { id: string; name: string; avatar_url: string | null };
      return {
        id: p.id,
        userId: p.user_id,
        name: userData.name,
        department: p.department || "",
        jobRole: p.job_role || "",
        officeLocation: p.office_location || "",
        mbti: p.mbti || undefined,
        avatarUrl: userData.avatar_url || undefined,
        hobbies: tagsByProfileId.get(p.id) || [],
      };
    });

    // AI 기반 조 편성
    const aiResult = await generateTeamsWithAI({
      criteriaText,
      teamSize,
      members,
    });

    // 결과 형식 변환
    const result = createAITeamGroupingResult(
      cohortId,
      user.id,
      members,
      teamSize,
      criteriaText,
      aiResult
    );

    // DB에 저장
    const { data: saved, error: saveError } = await serviceClient
      .from("team_groupings")
      .insert({
        cohort_id: cohortId,
        criteria_text: criteriaText,
        criteria_parsed: result.criteriaParsed as unknown as Json,
        team_size: teamSize,
        team_count: result.teamCount,
        teams_json: result.teams as unknown as Json,
        ungrouped_members: result.ungroupedMembers as unknown as Json,
        created_by: user.id,
      })
      .select("id, created_at")
      .single();

    if (saveError) {
      console.error("Error saving team grouping:", saveError);
      // 저장 실패해도 결과는 반환
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        id: saved?.id,
        createdAt: saved?.created_at,
      },
    });
  } catch (error) {
    console.error("Team grouping generate error:", error);

    // AI 조 편성 실패 시 에러 메시지 반환 (폴백 없음)
    const errorMessage = error instanceof Error
      ? error.message
      : "AI 조 편성에 실패했습니다. 다시 시도해주세요.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

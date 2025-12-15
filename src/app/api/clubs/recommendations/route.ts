import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  calculateClubRecommendation,
  UserProfile,
  Club,
  ClubMember,
  ClubRecommendation,
} from "@/lib/clubs/recommendationAlgorithm";

// GET /api/clubs/recommendations - 추천 동호회 목록
export async function GET(request: NextRequest) {
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const excludeJoined = searchParams.get("excludeJoined") !== "false";

    const serviceClient = createServiceClient();

    // 1. 사용자 프로필 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfileData } = await (serviceClient
      .from("users")
      .select("id, hobby_tags, mbti, department, job_role, location")
      .eq("id", user.id)
      .single() as any);

    if (!userProfileData) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      id: userProfileData.id,
      hobby_tags: userProfileData.hobby_tags || [],
      mbti: userProfileData.mbti,
      department: userProfileData.department,
      job_role: userProfileData.job_role,
      location: userProfileData.location,
    };

    // 2. 사용자가 가입한 동호회 ID 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: joinedClubs } = await (serviceClient
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id)
      .eq("status", "active") as any);

    const joinedClubIds = new Set(
      joinedClubs?.map((c: { club_id: string }) => c.club_id) || []
    );

    // 3. 추천 동료 목록 조회 (기존 추천 알고리즘에서)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recommendations } = await (serviceClient
      .from("users")
      .select("id")
      .neq("id", user.id)
      .limit(50) as any); // 간단히 다른 사용자 목록

    const recommendedUserIds = recommendations?.map((r: { id: string }) => r.id) || [];

    // 4. 모든 동호회 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clubs } = await (serviceClient
      .from("clubs")
      .select("*") as any);

    if (!clubs || clubs.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          clubs: [],
          meta: { algorithm: "v1", generatedAt: new Date().toISOString() },
        },
      });
    }

    // 5. 모든 동호회 회원 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allMembers } = await (serviceClient
      .from("club_members")
      .select("user_id, club_id")
      .eq("status", "active") as any);

    const clubMembers: ClubMember[] = allMembers || [];

    // 6. 최근 7일간 활동량 조회 (각 동호회별)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentPosts } = await (serviceClient
      .from("club_posts")
      .select("club_id")
      .gte("created_at", sevenDaysAgo.toISOString()) as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentChats } = await (serviceClient
      .from("club_chat_messages")
      .select("club_id")
      .gte("created_at", sevenDaysAgo.toISOString()) as any);

    // 활동량 집계
    const activityCounts = new Map<string, number>();
    recentPosts?.forEach((p: { club_id: string }) => {
      activityCounts.set(p.club_id, (activityCounts.get(p.club_id) || 0) + 1);
    });
    recentChats?.forEach((c: { club_id: string }) => {
      activityCounts.set(c.club_id, (activityCounts.get(c.club_id) || 0) + 1);
    });

    // 7. 회원 프로필 조회 (회원이 있는 동호회에 한해)
    const memberUserIds = [...new Set(clubMembers.map((m) => m.user_id))];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberProfiles } = await (serviceClient
      .from("users")
      .select("id, hobby_tags, mbti, department, job_role, location")
      .in("id", memberUserIds) as any);

    const profileMap = new Map<string, UserProfile>();
    memberProfiles?.forEach((p: UserProfile) => {
      profileMap.set(p.id, {
        ...p,
        hobby_tags: p.hobby_tags || [],
      });
    });

    // 8. 각 동호회에 대해 추천 점수 계산
    const clubRecommendations: ClubRecommendation[] = [];

    for (const clubData of clubs) {
      // 이미 가입한 동호회 제외
      if (excludeJoined && joinedClubIds.has(clubData.id)) {
        continue;
      }

      const club: Club = {
        id: clubData.id,
        name: clubData.name,
        category: clubData.category,
        tags: clubData.tags || [],
        member_count: clubData.member_count || 0,
        recent_activity_count: activityCounts.get(clubData.id) || 0,
      };

      // 해당 동호회 회원들의 프로필
      const clubMemberUserIds = clubMembers
        .filter((m) => m.club_id === club.id)
        .map((m) => m.user_id);

      const clubMemberProfiles: UserProfile[] = clubMemberUserIds
        .map((id) => profileMap.get(id))
        .filter((p): p is UserProfile => p !== undefined);

      const recommendation = calculateClubRecommendation(
        userProfile,
        club,
        clubMemberProfiles,
        recommendedUserIds,
        clubMembers
      );

      // 추가 정보 포함
      clubRecommendations.push({
        ...recommendation,
        club: {
          ...club,
          // 추가 정보
          ...clubData,
        },
      });
    }

    // 9. 점수 기준 정렬 및 제한
    clubRecommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = clubRecommendations.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        clubs: topRecommendations,
        meta: {
          algorithm: "v1",
          generatedAt: new Date().toISOString(),
          totalClubs: clubs.length,
          excludedJoined: excludeJoined,
        },
      },
    });
  } catch (error) {
    console.error("Club recommendations API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

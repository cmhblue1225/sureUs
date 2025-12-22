import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  calculateEnhancedMatchScore,
  type EnhancedMatchCandidate,
  DEFAULT_ENHANCED_WEIGHTS,
} from "@/lib/matching/enhancedAlgorithm";
import type { Database } from "@/types/database";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

type EmbeddingRow = Database["public"]["Tables"]["embeddings"]["Row"];

// Helper to parse embedding
function parseEmbedding(embedding: unknown): number[] | undefined {
  if (!embedding) return undefined;
  if (Array.isArray(embedding)) return embedding;
  if (typeof embedding === "string") {
    try {
      const parsed = JSON.parse(embedding);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// 프로필 완성도 계산 함수
function calculateProfileCompletion(profile: {
  org_level1?: string | null;
  job_position?: string | null;
  office_location?: string | null;
  mbti?: string | null;
  collaboration_style?: string | null;
  strengths?: string | null;
  preferred_people_type?: string | null;
} | null, hobbyCount: number): {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
} {
  const fieldLabels: Record<string, string> = {
    org_level1: "소속",
    job_position: "직급",
    office_location: "근무지",
    hobbies: "취미 태그",
    mbti: "MBTI",
    collaboration_style: "협업 스타일",
    strengths: "강점",
    preferred_people_type: "선호하는 사람",
  };

  const completedFields: string[] = [];
  const missingFields: string[] = [];
  let score = 0;

  // 필수 필드 (각 20점, 총 80점)
  if (profile?.org_level1) {
    score += 20;
    completedFields.push(fieldLabels.org_level1);
  } else {
    missingFields.push(fieldLabels.org_level1);
  }

  if (profile?.job_position) {
    score += 20;
    completedFields.push(fieldLabels.job_position);
  } else {
    missingFields.push(fieldLabels.job_position);
  }

  if (profile?.office_location) {
    score += 20;
    completedFields.push(fieldLabels.office_location);
  } else {
    missingFields.push(fieldLabels.office_location);
  }

  if (hobbyCount >= 1) {
    score += 20;
    completedFields.push(fieldLabels.hobbies);
  } else {
    missingFields.push(fieldLabels.hobbies);
  }

  // 선택 필드 (각 5점, 총 20점)
  if (profile?.mbti) {
    score += 5;
    completedFields.push(fieldLabels.mbti);
  } else {
    missingFields.push(fieldLabels.mbti);
  }

  if (profile?.collaboration_style) {
    score += 5;
    completedFields.push(fieldLabels.collaboration_style);
  } else {
    missingFields.push(fieldLabels.collaboration_style);
  }

  if (profile?.strengths) {
    score += 5;
    completedFields.push(fieldLabels.strengths);
  } else {
    missingFields.push(fieldLabels.strengths);
  }

  if (profile?.preferred_people_type) {
    score += 5;
    completedFields.push(fieldLabels.preferred_people_type);
  } else {
    missingFields.push(fieldLabels.preferred_people_type);
  }

  return {
    percentage: score,
    completedFields,
    missingFields,
  };
}

// GET /api/dashboard - 대시보드 통계 및 데이터 조회
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

    const serviceClient = createServiceClient();

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 사용자 프로필 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (serviceClient
      .from("profiles")
      .select("*, users!inner(name, avatar_url)")
      .eq("user_id", user.id)
      .single() as any);

    // 사용자 태그 조회 (프로필 완성도 계산용)
    const { data: userTags } = await serviceClient
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", profile?.id || "");

    const hobbyCount = userTags?.length || 0;
    // 관리자는 프로필 완성도를 표시하지 않음
    const profileCompletion = isAdmin ? null : calculateProfileCompletion(profile, hobbyCount);

    const userName = profile?.users?.name || "사용자";
    const userAvatar = profile?.users?.avatar_url || null;
    // 새로운 조직 구조 필드
    const orgLevel1 = profile?.org_level1 || "";
    const orgLevel2 = profile?.org_level2 || "";
    const orgLevel3 = profile?.org_level3 || "";
    const jobPosition = profile?.job_position || "";
    // 하위 호환성 필드
    const department = profile?.department || "";
    const jobRole = profile?.job_role || "";
    const hasProfile = profile?.is_profile_complete ?? false;

    // 병렬로 통계 데이터 조회
    const [
      unreadNotificationsResult,
      recommendationsCountResult,
      recommendedColleaguesResult,
      userEmbeddingResult,
      recentAnnouncementsResult,
      upcomingEventsResult,
      recentBoardPostsResult,
    ] = await Promise.all([
      // 읽지 않은 알림 수
      serviceClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),

      // 추천 동료 수 (같은 기수의 활성 프로필 수 - 본인)
      serviceClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("cohort_id", cohortId)
        .eq("is_profile_complete", true)
        .neq("user_id", user.id),

      // 추천 동료 후보 (같은 기수의 enhanced algorithm용 전체 데이터)
      serviceClient
        .from("profiles")
        .select("id, user_id, department, job_role, office_location, mbti, users!inner(id, name, avatar_url, deleted_at)")
        .eq("cohort_id", cohortId)
        .eq("is_profile_complete", true)
        .neq("user_id", user.id)
        .is("users.deleted_at", null)
        .limit(50),

      // 현재 사용자의 임베딩
      serviceClient
        .from("embeddings")
        .select("*")
        .eq("user_id", user.id)
        .single(),

      // 최근 공지사항 (같은 기수)
      serviceClient
        .from("announcements")
        .select(`
          id,
          title,
          category,
          is_important,
          is_pinned,
          created_at,
          author:users!announcements_user_id_fkey(name, avatar_url)
        `)
        .eq("cohort_id", cohortId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5),

      // 다가오는 일정 및 진행중인 일정
      // training 이벤트: 같은 기수의 교육 일정
      // personal 이벤트: 본인이 만든 개인 일정 (cohort_id 무관)
      // end_date >= now: 아직 끝나지 않은 일정 (진행중 + 예정)
      serviceClient
        .from("calendar_events")
        .select("*")
        .or(`and(event_type.eq.training,cohort_id.eq.${cohortId}),and(event_type.eq.personal,user_id.eq.${user.id})`)
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(5),

      // 최근 게시판 게시물 (같은 기수)
      serviceClient
        .from("board_posts")
        .select(`
          id,
          title,
          post_type,
          like_count,
          comment_count,
          created_at,
          author:users!board_posts_user_id_fkey(name, avatar_url)
        `)
        .eq("cohort_id", cohortId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // 추천 동료 계산 (Enhanced Algorithm 사용)
    const recommendedColleagues: Array<{
      id: string;
      name: string;
      department: string;
      jobRole: string;
      avatarUrl: string | null;
      matchScore: number;
    }> = [];

    if (recommendedColleaguesResult.data && hasProfile) {
      const candidates = recommendedColleaguesResult.data as Array<{
        id: string;
        user_id: string;
        department: string | null;
        job_role: string | null;
        office_location: string | null;
        mbti: string | null;
        users: { id: string; name: string; avatar_url: string | null; deleted_at: string | null };
      }>;

      // 후보자들의 임베딩과 태그 가져오기
      const candidateUserIds = candidates.map((c) => c.user_id);
      const candidateProfileIds = candidates.map((c) => c.id);

      const [candidateEmbeddingsResult, candidateTagsResult] = await Promise.all([
        serviceClient
          .from("embeddings")
          .select("*")
          .in("user_id", candidateUserIds),
        serviceClient
          .from("profile_tags")
          .select("profile_id, tag_name")
          .in("profile_id", candidateProfileIds),
      ]);

      // 임베딩 매핑
      const embeddingsByUserId = new Map<string, EmbeddingRow>();
      (candidateEmbeddingsResult.data as EmbeddingRow[] | null)?.forEach((e) => {
        embeddingsByUserId.set(e.user_id, e);
      });

      // 태그 매핑
      const tagsByProfileId = new Map<string, string[]>();
      (candidateTagsResult.data || []).forEach((t: { profile_id: string; tag_name: string }) => {
        const tags = tagsByProfileId.get(t.profile_id) || [];
        tags.push(t.tag_name);
        tagsByProfileId.set(t.profile_id, tags);
      });

      // 현재 사용자 정보 구성
      const userEmbedding = userEmbeddingResult.data as EmbeddingRow | null;
      const currentUser: EnhancedMatchCandidate = {
        userId: user.id,
        name: userName,
        department: department,
        jobRole: jobRole,
        officeLocation: profile?.office_location || "",
        mbti: profile?.mbti || undefined,
        hobbies: (userTags || []).map((t: { tag_name: string }) => t.tag_name),
        embedding: parseEmbedding(userEmbedding?.combined_embedding),
      };

      // Enhanced Algorithm으로 점수 계산
      const scored = candidates.map((c) => {
        const candidateEmbedding = embeddingsByUserId.get(c.user_id);
        const candidate: EnhancedMatchCandidate = {
          userId: c.user_id,
          name: c.users.name,
          department: c.department || "",
          jobRole: c.job_role || "",
          officeLocation: c.office_location || "",
          mbti: c.mbti || undefined,
          avatarUrl: c.users.avatar_url || undefined,
          hobbies: tagsByProfileId.get(c.id) || [],
          embedding: parseEmbedding(candidateEmbedding?.combined_embedding),
        };

        const scores = calculateEnhancedMatchScore(
          currentUser,
          candidate,
          null,
          DEFAULT_ENHANCED_WEIGHTS
        );

        return {
          id: c.user_id,
          name: c.users.name,
          department: c.department || "",
          jobRole: c.job_role || "",
          avatarUrl: c.users.avatar_url,
          matchScore: Math.round(scores.totalScore * 100),
        };
      });

      // 점수 순으로 정렬하고 상위 3명 선택
      scored.sort((a, b) => b.matchScore - a.matchScore);
      recommendedColleagues.push(...scored.slice(0, 3));
    }

    // 통계 데이터 집계
    const stats = {
      unreadNotifications: unreadNotificationsResult.count || 0,
      totalRecommendations: recommendationsCountResult.count || 0,
    };

    // 최근 공지사항 포맷
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentAnnouncements = (recentAnnouncementsResult.data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      isImportant: a.is_important,
      isPinned: a.is_pinned,
      createdAt: a.created_at,
      author: a.author,
    }));

    // 다가오는 일정 포맷
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upcomingEvents = (upcomingEventsResult.data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      eventType: e.event_type,
      startDate: e.start_date,
      endDate: e.end_date,
      location: e.location,
      color: e.color,
      allDay: e.all_day,
    }));

    // 최근 게시판 게시물 포맷
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentBoardPosts = (recentBoardPostsResult.data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      postType: p.post_type,
      likeCount: p.like_count,
      commentCount: p.comment_count,
      createdAt: p.created_at,
      author: p.author,
    }));

    return NextResponse.json({
      success: true,
      data: {
        userName,
        userAvatar,
        // 새로운 조직 구조 필드
        orgLevel1,
        orgLevel2,
        orgLevel3,
        jobPosition,
        // 하위 호환성 필드
        department,
        jobRole,
        hasProfile,
        stats,
        profileCompletion,
        recommendedColleagues,
        recentAnnouncements,
        upcomingEvents,
        recentBoardPosts,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

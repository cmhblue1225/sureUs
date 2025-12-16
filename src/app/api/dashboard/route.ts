import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  calculateEnhancedMatchScore,
  type EnhancedMatchCandidate,
  DEFAULT_ENHANCED_WEIGHTS,
} from "@/lib/matching/enhancedAlgorithm";
import type { Database } from "@/types/database";

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
  department?: string | null;
  job_role?: string | null;
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
    department: "부서",
    job_role: "직군",
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
  if (profile?.department) {
    score += 20;
    completedFields.push(fieldLabels.department);
  } else {
    missingFields.push(fieldLabels.department);
  }

  if (profile?.job_role) {
    score += 20;
    completedFields.push(fieldLabels.job_role);
  } else {
    missingFields.push(fieldLabels.job_role);
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
    const profileCompletion = calculateProfileCompletion(profile, hobbyCount);

    const userName = profile?.users?.name || "사용자";
    const userAvatar = profile?.users?.avatar_url || null;
    const department = profile?.department || "";
    const jobRole = profile?.job_role || "";
    const hasProfile = profile?.is_profile_complete ?? false;

    // 병렬로 통계 데이터 조회
    const [
      unreadMessagesResult,
      unreadNotificationsResult,
      myClubsResult,
      recentClubPostsResult,
      recommendationsCountResult,
      recommendedColleaguesResult,
      allClubsResult,
      userEmbeddingResult,
    ] = await Promise.all([
      // 읽지 않은 메시지 수
      serviceClient
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false),

      // 읽지 않은 알림 수
      serviceClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),

      // 가입한 동호회 목록
      serviceClient
        .from("club_members")
        .select(`
          club_id,
          role,
          clubs!inner(id, name, description, category, member_count, image_url)
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(5),

      // 가입한 동호회의 최근 게시물
      serviceClient
        .from("club_members")
        .select("club_id")
        .eq("user_id", user.id)
        .eq("status", "active"),

      // 추천 동료 수 (전체 활성 프로필 수 - 본인)
      serviceClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_profile_complete", true)
        .neq("user_id", user.id),

      // 추천 동료 후보 (enhanced algorithm용 전체 데이터)
      serviceClient
        .from("profiles")
        .select("id, user_id, department, job_role, office_location, mbti, users!inner(id, name, avatar_url, deleted_at)")
        .eq("is_profile_complete", true)
        .neq("user_id", user.id)
        .is("users.deleted_at", null)
        .limit(50),

      // 미가입 동호회 목록 (추천용)
      serviceClient
        .from("clubs")
        .select("id, name, category, member_count, image_url")
        .order("member_count", { ascending: false })
        .limit(10),

      // 현재 사용자의 임베딩
      serviceClient
        .from("embeddings")
        .select("*")
        .eq("user_id", user.id)
        .single(),
    ]);

    // 가입한 동호회의 최근 게시물 조회
    const myClubIds = (recentClubPostsResult.data || []).map((m: { club_id: string }) => m.club_id);

    let recentPosts: Array<{
      id: string;
      title: string;
      type: string;
      created_at: string;
      club: { id: string; name: string };
      author: { name: string; avatar_url: string | null };
    }> = [];

    // 진행 중인 투표
    let activePolls: Array<{
      postId: string;
      clubId: string;
      clubName: string;
      question: string;
      optionCount: number;
      endDate: string | null;
      totalVotes: number;
    }> = [];

    if (myClubIds.length > 0) {
      // 최근 게시물 조회
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: posts } = await (serviceClient
        .from("club_posts")
        .select(`
          id,
          title,
          type,
          created_at,
          clubs!inner(id, name),
          author:users!club_posts_author_id_fkey(name, avatar_url)
        `)
        .in("club_id", myClubIds)
        .order("created_at", { ascending: false })
        .limit(5) as any);

      recentPosts = (posts || []).map((post: {
        id: string;
        title: string;
        type: string;
        created_at: string;
        clubs: { id: string; name: string };
        author: { name: string; avatar_url: string | null };
      }) => ({
        id: post.id,
        title: post.title,
        type: post.type,
        created_at: post.created_at,
        club: post.clubs,
        author: post.author,
      }));

      // 진행 중인 투표 조회
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pollPosts } = await (serviceClient
        .from("club_posts")
        .select(`
          id,
          club_id,
          clubs!inner(id, name),
          club_polls!inner(id, question, options, end_date, is_closed)
        `)
        .in("club_id", myClubIds)
        .eq("type", "poll")
        .eq("club_polls.is_closed", false)
        .order("created_at", { ascending: false })
        .limit(10) as any);

      if (pollPosts && pollPosts.length > 0) {
        // 사용자가 이미 투표한 poll_id 목록 조회
        const pollIds = pollPosts.map((p: { club_polls: { id: string } }) => p.club_polls.id);
        const { data: userVotes } = await serviceClient
          .from("club_poll_votes")
          .select("poll_id")
          .eq("user_id", user.id)
          .in("poll_id", pollIds);

        const votedPollIds = new Set((userVotes || []).map((v: { poll_id: string }) => v.poll_id));

        // 투표하지 않은 것만 필터링
        activePolls = pollPosts
          .filter((post: { club_polls: { id: string; end_date: string | null } }) => {
            const poll = post.club_polls;
            // 이미 투표했으면 제외
            if (votedPollIds.has(poll.id)) return false;
            // 마감일이 지났으면 제외
            if (poll.end_date && new Date(poll.end_date) < new Date()) return false;
            return true;
          })
          .slice(0, 3)
          .map((post: {
            id: string;
            club_id: string;
            clubs: { id: string; name: string };
            club_polls: {
              id: string;
              question: string;
              options: string[];
              end_date: string | null;
            };
          }) => ({
            postId: post.id,
            clubId: post.club_id,
            clubName: post.clubs.name,
            question: post.club_polls.question,
            optionCount: post.club_polls.options?.length || 0,
            endDate: post.club_polls.end_date,
            totalVotes: 0, // 성능을 위해 생략
          }));
      }
    }

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

    // 추천 동호회 (미가입 동호회 중 인기순)
    const myClubIdSet = new Set(myClubIds);
    const recommendedClubs: Array<{
      id: string;
      name: string;
      category: string;
      memberCount: number;
      imageUrl: string | null;
      score: number;
    }> = [];

    if (allClubsResult.data) {
      const clubs = allClubsResult.data as Array<{
        id: string;
        name: string;
        category: string;
        member_count: number;
        image_url: string | null;
      }>;

      // 미가입 동호회만 필터링
      const notJoinedClubs = clubs.filter((c) => !myClubIdSet.has(c.id));

      recommendedClubs.push(
        ...notJoinedClubs.slice(0, 3).map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          memberCount: c.member_count,
          imageUrl: c.image_url,
          score: Math.min(c.member_count * 10, 100), // 멤버 수 기반 간단한 점수
        }))
      );
    }

    // 통계 데이터 집계
    const stats = {
      unreadMessages: unreadMessagesResult.count || 0,
      unreadNotifications: unreadNotificationsResult.count || 0,
      myClubsCount: (myClubsResult.data || []).length,
      totalRecommendations: recommendationsCountResult.count || 0,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myClubs = (myClubsResult.data || []).map((m: any) => ({
      id: m.clubs.id,
      name: m.clubs.name,
      description: m.clubs.description,
      category: m.clubs.category,
      memberCount: m.clubs.member_count,
      imageUrl: m.clubs.image_url,
      role: m.role,
    }));

    return NextResponse.json({
      success: true,
      data: {
        userName,
        userAvatar,
        department,
        jobRole,
        hasProfile,
        stats,
        myClubs,
        recentPosts,
        // 새로 추가된 데이터
        profileCompletion,
        activePolls,
        recommendedColleagues,
        recommendedClubs,
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

import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/openai/embeddings";
import {
  expandSemanticQuery,
  expandedQueryToSearchText,
  analyzeQuery,
  type ExpandedQuery,
} from "@/lib/anthropic/queryExpansion";
import {
  performSemanticSearch,
  type SemanticSearchCandidate,
} from "@/lib/matching/semanticMatcher";
import type { Database } from "@/types/database";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EmbeddingRow = Database["public"]["Tables"]["embeddings"]["Row"];

// 검색 결과 노드 타입 (관련도 점수 포함)
export interface SearchResultNode {
  id: string;
  userId: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];
  isCurrentUser: boolean;
  relevanceScore: number; // 0-1, 검색 관련도 (0 = 관련 없음)
  matchedFields?: string[]; // 매칭된 필드들
}

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

// POST /api/graph/semantic-search
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

    // Parse request body
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "검색어가 필요합니다." },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return NextResponse.json(
        { success: false, error: "검색어는 2자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    if (trimmedQuery.length > 200) {
      return NextResponse.json(
        { success: false, error: "검색어는 200자 이하여야 합니다." },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // 1. 쿼리 분석 (전략 자동 결정)
    const queryAnalysis = analyzeQuery(trimmedQuery);

    // 2. Claude로 쿼리 확장 (자동화된 단일 모드)
    let expandedQuery: ExpandedQuery | null = null;
    let usedFallback = false;

    try {
      expandedQuery = await expandSemanticQuery(trimmedQuery);
      if (expandedQuery && expandedQuery.confidence < 0.5) {
        usedFallback = true;
      }
    } catch (error) {
      console.error("Query expansion error:", error);
      usedFallback = true;
    }

    if (!expandedQuery) {
      // 폴백: 기본 확장
      const keywords = trimmedQuery.split(/\s+/).filter(k => k.length > 1);
      expandedQuery = {
        originalQuery: trimmedQuery,
        expandedDescription: trimmedQuery,
        suggestedMbtiTypes: [],
        suggestedHobbyTags: [],
        searchKeywords: keywords,
        profileFieldHints: {
          collaborationStyle: keywords,
          strengths: keywords,
          preferredPeopleType: keywords,
        },
        confidence: 0.3,
        queryIntent: 'general',
        intentConfidence: 0.5,
      };
      usedFallback = true;
    }

    // 3. 확장된 쿼리로 임베딩 생성
    const searchText = expandedQueryToSearchText(expandedQuery);
    let queryEmbedding: number[];

    try {
      queryEmbedding = await generateEmbedding(searchText);
    } catch (error) {
      console.error("Embedding generation error:", error);
      return NextResponse.json(
        { success: false, error: "검색 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 3. 현재 사용자의 기수 확인
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 4. 현재 사용자의 프로필 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfileData } = (await supabase
      .from("profiles")
      .select("*, users!inner(id, name, avatar_url)")
      .eq("user_id", user.id)
      .single()) as any;

    // 5. 모든 프로필 및 임베딩 조회 (동일 기수)
    const serviceClient = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = (await serviceClient
      .from("profiles")
      .select(
        `
        *,
        users!inner(id, name, avatar_url, deleted_at)
      `
      )
      .eq("cohort_id", cohortId)
      .eq("is_profile_complete", true)
      .neq("user_id", user.id)
      .neq("role", "admin")
      .is("users.deleted_at", null)
      .limit(100)) as any;

    if (!profiles || profiles.length === 0) {
      // 현재 사용자만 반환
      const currentUserNode: SearchResultNode = {
        id: user.id,
        userId: user.id,
        name: userProfileData?.users?.name || "나",
        department: userProfileData?.department || "",
        jobRole: userProfileData?.job_role || "",
        officeLocation: userProfileData?.office_location || "",
        mbti: userProfileData?.mbti || undefined,
        avatarUrl: userProfileData?.users?.avatar_url || undefined,
        hobbies: [],
        isCurrentUser: true,
        relevanceScore: 1, // 자기 자신
      };

      return NextResponse.json({
        success: true,
        data: {
          nodes: [currentUserNode],
          currentUserId: user.id,
          searchMeta: {
            originalQuery: trimmedQuery,
            expandedQuery,
            totalResults: 0,
            searchTime: Date.now() - startTime,
            usedFallback,
            searchStrategy: queryAnalysis.suggestedStrategy,
          },
        },
      });
    }

    // 프로필 ID와 유저 ID 매핑
    const profileIds = profiles.map((p: ProfileRow) => p.id);
    const userIds = profiles.map((p: ProfileRow) => p.user_id);

    // 태그 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allTags } = (await serviceClient
      .from("profile_tags")
      .select("profile_id, tag_name")
      .in("profile_id", profileIds)) as any;

    // 임베딩 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: embeddings } = (await serviceClient
      .from("embeddings")
      .select("*")
      .in("user_id", userIds)) as any;

    // 태그 매핑
    const tagsByProfileId = new Map<string, string[]>();
    allTags?.forEach((t: { profile_id: string; tag_name: string }) => {
      const tags = tagsByProfileId.get(t.profile_id) || [];
      tags.push(t.tag_name);
      tagsByProfileId.set(t.profile_id, tags);
    });

    // 임베딩 매핑
    const embeddingsByUserId = new Map<string, EmbeddingRow>();
    (embeddings as EmbeddingRow[] | null)?.forEach((e) => {
      embeddingsByUserId.set(e.user_id, e);
    });

    // 4. 검색 후보 구성
    const candidates: SemanticSearchCandidate[] = profiles.map(
      (profile: ProfileRow & { users: { id: string; name: string; avatar_url: string | null } }) => {
        const userData = profile.users;
        const embedding = embeddingsByUserId.get(profile.user_id);

        return {
          userId: profile.user_id,
          name: userData.name,
          department: profile.department,
          jobRole: profile.job_role,
          officeLocation: profile.office_location,
          mbti: profile.mbti || undefined,
          avatarUrl: userData.avatar_url || undefined,
          hobbies: tagsByProfileId.get(profile.id) || [],
          collaborationStyle: profile.collaboration_style || undefined,
          strengths: profile.strengths || undefined,
          preferredPeopleType: profile.preferred_people_type || undefined,
          // 새 필드
          livingLocation: profile.living_location || undefined,
          hometown: profile.hometown || undefined,
          education: profile.education || undefined,
          workDescription: profile.work_description || undefined,
          techStack: profile.tech_stack || undefined,
          favoriteFood: profile.favorite_food || undefined,
          ageRange: profile.age_range || undefined,
          interests: profile.interests || undefined,
          careerGoals: profile.career_goals || undefined,
          certifications: profile.certifications || undefined,
          languages: profile.languages || undefined,
          // 임베딩
          embedding: parseEmbedding(embedding?.combined_embedding),
        };
      }
    );

    // 5. 하이브리드 검색 수행 (쿼리 전략 적용)
    const searchResults = performSemanticSearch(candidates, {
      expandedQuery,
      queryEmbedding,
      limit: 100, // 모든 후보 포함
      minScore: 0, // 모든 점수 포함
      searchStrategy: queryAnalysis.suggestedStrategy,
    });

    // 6. 검색 결과 맵 생성 (userId -> score, matchedFields)
    const searchResultMap = new Map<string, { score: number; matchedFields?: string[] }>();
    searchResults.forEach((result) => {
      searchResultMap.set(result.userId, {
        score: result.totalScore,
        matchedFields: result.matchReasons,
      });
    });

    // 7. 현재 사용자 태그 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userTags } = (await serviceClient
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", userProfileData?.id)) as any;

    // 8. 모든 노드 생성 (현재 사용자 포함)
    const allNodes: SearchResultNode[] = [
      // 현재 사용자 (중앙)
      {
        id: user.id,
        userId: user.id,
        name: userProfileData?.users?.name || "나",
        department: userProfileData?.department || "",
        jobRole: userProfileData?.job_role || "",
        officeLocation: userProfileData?.office_location || "",
        mbti: userProfileData?.mbti || undefined,
        avatarUrl: userProfileData?.users?.avatar_url || undefined,
        hobbies: userTags?.map((t: { tag_name: string }) => t.tag_name) || [],
        isCurrentUser: true,
        relevanceScore: 1, // 자기 자신
      },
      // 다른 사용자들
      ...candidates.map((candidate) => {
        const searchResult = searchResultMap.get(candidate.userId);
        return {
          id: candidate.userId,
          userId: candidate.userId,
          name: candidate.name,
          department: candidate.department,
          jobRole: candidate.jobRole,
          officeLocation: candidate.officeLocation,
          mbti: candidate.mbti,
          avatarUrl: candidate.avatarUrl,
          hobbies: candidate.hobbies,
          isCurrentUser: false,
          relevanceScore: searchResult?.score || 0,
          matchedFields: searchResult?.matchedFields,
        };
      }),
    ];

    // 관련도순 정렬 (현재 사용자는 항상 첫 번째)
    allNodes.sort((a, b) => {
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      return b.relevanceScore - a.relevanceScore;
    });

    const searchTime = Date.now() - startTime;
    const matchedCount = searchResults.filter((r) => r.totalScore >= 0.15).length;

    return NextResponse.json({
      success: true,
      data: {
        nodes: allNodes,
        currentUserId: user.id,
        searchMeta: {
          originalQuery: trimmedQuery,
          expandedQuery,
          totalResults: matchedCount,
          totalNodes: allNodes.length,
          searchTime,
          usedFallback,
          searchStrategy: queryAnalysis.suggestedStrategy,
        },
      },
    });
  } catch (error) {
    console.error("Semantic search API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

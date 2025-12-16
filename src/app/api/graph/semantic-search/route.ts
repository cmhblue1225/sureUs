import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/openai/embeddings";
import {
  expandSemanticQuery,
  createExactSearchQuery,
  expandedQueryToSearchText,
  type ExpandedQuery,
} from "@/lib/anthropic/queryExpansion";
import {
  performSemanticSearch,
  resultsToGraphNodes,
  type SemanticSearchCandidate,
} from "@/lib/matching/semanticMatcher";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
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
    const { query, searchMode = "exact" } = body;

    // searchMode 검증: "exact" 또는 "broad"
    const validSearchMode = searchMode === "broad" ? "broad" : "exact";

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

    // 1. 검색 모드에 따라 쿼리 확장
    let expandedQuery: ExpandedQuery | null = null;
    let usedFallback = false;

    if (validSearchMode === "exact") {
      // 정확 모드: LLM 확장 없이 직접 키워드 매칭
      expandedQuery = createExactSearchQuery(trimmedQuery);
    } else {
      // 넓게 모드: Claude로 쿼리 확장
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
        };
        usedFallback = true;
      }
    }

    // 2. 확장된 쿼리로 임베딩 생성
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

    // 3. 모든 프로필 및 임베딩 조회
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
      .eq("is_profile_complete", true)
      .neq("user_id", user.id)
      .is("users.deleted_at", null)
      .limit(100)) as any;

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          nodes: [],
          edges: [],
          searchMeta: {
            originalQuery: trimmedQuery,
            expandedQuery,
            totalResults: 0,
            searchTime: Date.now() - startTime,
            usedFallback,
            searchMode: validSearchMode,
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
          embedding: parseEmbedding(embedding?.combined_embedding),
        };
      }
    );

    // 5. 하이브리드 검색 수행
    const searchResults = performSemanticSearch(candidates, {
      expandedQuery,
      queryEmbedding,
      limit: 30,
      minScore: 0.15,
    });

    // 6. 그래프 노드/엣지 형식으로 변환
    const { nodes, edges } = resultsToGraphNodes(searchResults, user.id);

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        edges,
        searchMeta: {
          originalQuery: trimmedQuery,
          expandedQuery,
          totalResults: searchResults.length,
          searchTime,
          usedFallback,
          searchMode: validSearchMode,
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

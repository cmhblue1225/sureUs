import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  calculateEnhancedMatchScore,
  DEFAULT_ENHANCED_WEIGHTS,
  type EnhancedMatchCandidate,
} from "@/lib/matching/enhancedAlgorithm";
import {
  buildClusteredNetwork,
  filterEdgesBySimilarity,
  type ClusteringResult,
} from "@/lib/graph/clustering";
import { getEffectiveCohortId, isUserAdmin } from "@/lib/utils/cohort";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EmbeddingRow = Database["public"]["Tables"]["embeddings"]["Row"];
type ProfileWithUser = ProfileRow & { users: { id: string; name: string; avatar_url: string | null; deleted_at: string | null } };

// Helper to parse embedding that may be stored as JSON string or already an array
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

// 키워드 매칭 함수
function matchesKeywords(
  hobbies: string[],
  keywords: string[],
  mode: "any" | "all"
): boolean {
  if (keywords.length === 0) return true;

  const normalizedHobbies = hobbies.map(h => h.toLowerCase());
  const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());

  if (mode === "all") {
    // 모든 키워드가 포함되어야 함
    return normalizedKeywords.every(keyword =>
      normalizedHobbies.some(hobby => hobby.includes(keyword))
    );
  } else {
    // 하나라도 포함되면 됨
    return normalizedKeywords.some(keyword =>
      normalizedHobbies.some(hobby => hobby.includes(keyword))
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minSimilarity = parseFloat(searchParams.get("minSimilarity") || "0.2");
    const maxNodes = Math.min(parseInt(searchParams.get("maxNodes") || "50"), 100);
    const canvasWidth = parseInt(searchParams.get("width") || "800");
    const canvasHeight = parseInt(searchParams.get("height") || "600");

    // 키워드 필터 파라미터
    const keywords = searchParams.get("keywords") || "";
    const filterMode = (searchParams.get("filterMode") || "any") as "any" | "all";
    const keywordList = keywords ? keywords.split(",").map(k => k.trim()).filter(k => k) : [];

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 현재 사용자의 기수 ID 가져오기
    const isAdmin = await isUserAdmin(supabase, user.id);
    const cohortId = await getEffectiveCohortId(supabase, user.id, isAdmin);

    if (!cohortId) {
      return NextResponse.json(
        { success: false, error: "기수가 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // Get current user's profile
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*, users!inner(name, avatar_url)")
      .eq("user_id", user.id)
      .single<ProfileWithUser>();

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "프로필을 먼저 작성해주세요." },
        { status: 400 }
      );
    }

    // Get user's tags
    const { data: userTags } = await supabase
      .from("profile_tags")
      .select("tag_name")
      .eq("profile_id", userProfile.id);

    // Get user's embedding
    const { data: userEmbedding } = await supabase
      .from("embeddings")
      .select("*")
      .eq("user_id", user.id)
      .single<EmbeddingRow>();

    // Build current user candidate
    const currentUser: EnhancedMatchCandidate = {
      userId: user.id,
      name: (userProfile.users as { name: string }).name,
      department: userProfile.department,
      jobRole: userProfile.job_role,
      officeLocation: userProfile.office_location,
      mbti: userProfile.mbti || undefined,
      avatarUrl: (userProfile.users as { avatar_url: string | null }).avatar_url || undefined,
      hobbies: userTags?.map((t: { tag_name: string }) => t.tag_name) || [],
      embedding: parseEmbedding(userEmbedding?.combined_embedding),
      collaborationStyleEmbedding: parseEmbedding(userEmbedding?.collaboration_style_embedding),
      strengthsEmbedding: parseEmbedding(userEmbedding?.strengths_embedding),
      preferredPeopleTypeEmbedding: parseEmbedding(userEmbedding?.preferred_people_type_embedding),
    };

    // Get all other profiles using service client - filter by cohort_id
    const serviceClient = createServiceClient();

    const { data: otherProfiles } = await serviceClient
      .from("profiles")
      .select(`
        *,
        users!inner(id, name, avatar_url, deleted_at)
      `)
      .eq("cohort_id", cohortId)
      .eq("is_profile_complete", true)
      .neq("user_id", user.id)
      .neq("role", "admin")
      .is("users.deleted_at", null)
      .limit(maxNodes);

    if (!otherProfiles || otherProfiles.length === 0) {
      // Return just the current user with a single cluster
      const result: ClusteringResult = {
        clusters: [{
          id: `cluster-${userProfile.department}`,
          label: userProfile.department,
          department: userProfile.department,
          color: "#3B82F6",
          memberIds: [user.id],
          center: { x: canvasWidth / 2, y: canvasHeight / 2 },
          radius: 60,
          isExpanded: true,
        }],
        nodes: [{
          id: user.id,
          userId: user.id,
          name: currentUser.name,
          department: userProfile.department,
          jobRole: userProfile.job_role,
          officeLocation: userProfile.office_location,
          mbti: userProfile.mbti || undefined,
          avatarUrl: currentUser.avatarUrl,
          hobbies: currentUser.hobbies,
          isCurrentUser: true,
          clusterId: `cluster-${userProfile.department}`,
          position: { x: canvasWidth / 2, y: canvasHeight / 2 },
        }],
        edges: [],
        stats: {
          totalNodes: 1,
          totalEdges: 0,
          clusterCount: 1,
          averageSimilarity: 0,
        },
      };

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Get tags for all profiles
    const typedProfiles = otherProfiles as ProfileWithUser[];
    const profileIds = typedProfiles.map((p) => p.id);
    const candidateUserIds = typedProfiles.map((p) => p.user_id);

    const { data: allTags } = await serviceClient
      .from("profile_tags")
      .select("profile_id, tag_name")
      .in("profile_id", profileIds);

    const { data: candidateEmbeddings } = await serviceClient
      .from("embeddings")
      .select("*")
      .in("user_id", candidateUserIds);

    // Build tag map
    const tagsByProfileId = new Map<string, string[]>();
    allTags?.forEach((t: { profile_id: string; tag_name: string }) => {
      const tags = tagsByProfileId.get(t.profile_id) || [];
      tags.push(t.tag_name);
      tagsByProfileId.set(t.profile_id, tags);
    });

    // Build embedding map
    const embeddingsByUserId = new Map<string, EmbeddingRow>();
    (candidateEmbeddings as EmbeddingRow[] | null)?.forEach((e) => {
      embeddingsByUserId.set(e.user_id, e);
    });

    // Build other users as candidates
    const allOtherUsers: EnhancedMatchCandidate[] = typedProfiles.map((profile) => {
      const userData = profile.users as { id: string; name: string; avatar_url: string | null };
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
        embedding: parseEmbedding(embedding?.combined_embedding),
        collaborationStyleEmbedding: parseEmbedding(embedding?.collaboration_style_embedding),
        strengthsEmbedding: parseEmbedding(embedding?.strengths_embedding),
        preferredPeopleTypeEmbedding: parseEmbedding(embedding?.preferred_people_type_embedding),
      };
    });

    // Filter to only include users related to the current user (above minSimilarity threshold + keyword filter)
    const relatedUsers = allOtherUsers.filter((otherUser) => {
      // 키워드 필터 적용
      if (keywordList.length > 0) {
        if (!matchesKeywords(otherUser.hobbies, keywordList, filterMode)) {
          return false;
        }
      }

      // 유사도 필터 적용
      const scores = calculateEnhancedMatchScore(
        currentUser,
        otherUser,
        null,
        DEFAULT_ENHANCED_WEIGHTS
      );
      return scores.totalScore >= minSimilarity;
    });

    // If no related users found, return just the current user
    if (relatedUsers.length === 0) {
      const result: ClusteringResult = {
        clusters: [{
          id: `cluster-${userProfile.department}`,
          label: userProfile.department,
          department: userProfile.department,
          color: "#3B82F6",
          memberIds: [user.id],
          center: { x: canvasWidth / 2, y: canvasHeight / 2 },
          radius: 60,
          isExpanded: true,
        }],
        nodes: [{
          id: user.id,
          userId: user.id,
          name: currentUser.name,
          department: userProfile.department,
          jobRole: userProfile.job_role,
          officeLocation: userProfile.office_location,
          mbti: userProfile.mbti || undefined,
          avatarUrl: currentUser.avatarUrl,
          hobbies: currentUser.hobbies,
          isCurrentUser: true,
          clusterId: `cluster-${userProfile.department}`,
          position: { x: canvasWidth / 2, y: canvasHeight / 2 },
        }],
        edges: [],
        stats: {
          totalNodes: 1,
          totalEdges: 0,
          clusterCount: 1,
          averageSimilarity: 0,
        },
      };

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Build clustered network with only related users
    const clusteringResult = buildClusteredNetwork(currentUser, relatedUsers, {
      minSimilarity,
      maxNodesPerCluster: 15,
      canvasSize: { width: canvasWidth, height: canvasHeight },
    });

    // Apply similarity filter if specified
    const filteredEdges = filterEdgesBySimilarity(clusteringResult.edges, minSimilarity);

    return NextResponse.json({
      success: true,
      data: {
        ...clusteringResult,
        edges: filteredEdges,
        stats: {
          ...clusteringResult.stats,
          totalEdges: filteredEdges.length,
        },
      },
    });
  } catch (error) {
    console.error("Network API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

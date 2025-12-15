import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  calculateEnhancedMatchScore,
  generateEnhancedExplanation,
  getConversationStarters,
  type EnhancedMatchCandidate,
  type EnhancedMatchWeights,
  type EnhancedUserPreferences,
  DEFAULT_ENHANCED_WEIGHTS,
} from "@/lib/matching/enhancedAlgorithm";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type EmbeddingRow = Database["public"]["Tables"]["embeddings"]["Row"];
type PreferencesRow = Database["public"]["Tables"]["preferences"]["Row"];
type ProfileWithUser = ProfileRow & { users: { id: string; name: string; avatar_url: string | null } };

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Get current user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single<ProfileRow>();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: "프로필을 먼저 작성해주세요." },
        { status: 400 }
      );
    }

    if (!userProfile.is_profile_complete) {
      return NextResponse.json(
        { success: false, error: "프로필을 완성해주세요." },
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

    // Get user's preferences
    const { data: userPreferences } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .single<PreferencesRow>();

    // Get candidates using service client to bypass RLS for matching
    const serviceClient = createServiceClient();

    // Get all other complete profiles
    const { data: candidateProfiles, error: candidatesError } = await serviceClient
      .from("profiles")
      .select(`
        *,
        users!inner(id, name, avatar_url, deleted_at)
      `)
      .eq("is_profile_complete", true)
      .neq("user_id", user.id)
      .is("users.deleted_at", null);

    if (candidatesError) {
      console.error("Candidates fetch error:", candidatesError);
      return NextResponse.json(
        { success: false, error: "후보자 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!candidateProfiles || candidateProfiles.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          recommendations: [],
          meta: {
            generatedAt: new Date().toISOString(),
            nextRefreshAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            totalCandidates: 0,
          },
        },
      });
    }

    // Get candidate data (tags and embeddings)
    const typedCandidates = candidateProfiles as ProfileWithUser[];
    const candidateIds = typedCandidates.map((p) => p.user_id);
    const profileIds = typedCandidates.map((p) => p.id);

    const { data: candidateTags } = await serviceClient
      .from("profile_tags")
      .select("profile_id, tag_name")
      .in("profile_id", profileIds);

    const { data: candidateEmbeddings } = await serviceClient
      .from("embeddings")
      .select("*")
      .in("user_id", candidateIds);

    // Build candidate objects
    const tagsByProfileId = new Map<string, string[]>();
    candidateTags?.forEach((t: { profile_id: string; tag_name: string }) => {
      const tags = tagsByProfileId.get(t.profile_id) || [];
      tags.push(t.tag_name);
      tagsByProfileId.set(t.profile_id, tags);
    });

    const embeddingsByUserId = new Map<string, EmbeddingRow>();
    (candidateEmbeddings as EmbeddingRow[] | null)?.forEach((e) => {
      embeddingsByUserId.set(e.user_id, e);
    });

    // Build current user candidate object
    const currentUser: EnhancedMatchCandidate = {
      userId: user.id,
      name: "",
      department: userProfile.department,
      jobRole: userProfile.job_role,
      officeLocation: userProfile.office_location,
      mbti: userProfile.mbti || undefined,
      hobbies: userTags?.map((t: { tag_name: string }) => t.tag_name) || [],
      embedding: parseEmbedding(userEmbedding?.combined_embedding),
      collaborationStyleEmbedding: parseEmbedding(userEmbedding?.collaboration_style_embedding),
      strengthsEmbedding: parseEmbedding(userEmbedding?.strengths_embedding),
      preferredPeopleTypeEmbedding: parseEmbedding(userEmbedding?.preferred_people_type_embedding),
    };

    // Build enhanced weights from user preferences
    const weights: EnhancedMatchWeights = userPreferences ? {
      embeddingWeight: userPreferences.embedding_weight ?? DEFAULT_ENHANCED_WEIGHTS.embeddingWeight,
      tagWeight: userPreferences.tag_weight ?? DEFAULT_ENHANCED_WEIGHTS.tagWeight,
      mbtiWeight: (userPreferences as Record<string, unknown>).mbti_weight as number ?? DEFAULT_ENHANCED_WEIGHTS.mbtiWeight,
      jobRoleWeight: (userPreferences as Record<string, unknown>).job_role_weight as number ?? DEFAULT_ENHANCED_WEIGHTS.jobRoleWeight,
      departmentWeight: (userPreferences as Record<string, unknown>).department_weight as number ?? DEFAULT_ENHANCED_WEIGHTS.departmentWeight,
      locationWeight: (userPreferences as Record<string, unknown>).location_weight as number ?? DEFAULT_ENHANCED_WEIGHTS.locationWeight,
      preferenceWeight: userPreferences.preference_weight ?? DEFAULT_ENHANCED_WEIGHTS.preferenceWeight,
    } : DEFAULT_ENHANCED_WEIGHTS;

    // Build enhanced user preferences
    const enhancedPreferences: EnhancedUserPreferences | null = userPreferences ? {
      preferredDepartments: userPreferences.preferred_departments || undefined,
      preferredJobRoles: userPreferences.preferred_job_roles || undefined,
      preferredLocations: userPreferences.preferred_locations || undefined,
      preferredMbtiTypes: userPreferences.preferred_mbti_types || undefined,
      preferCrossDepartment: (userPreferences as Record<string, unknown>).prefer_cross_department as boolean ?? true,
    } : null;

    // Calculate scores for each candidate using enhanced algorithm
    const scoredCandidates = typedCandidates.map((profile) => {
      const candidateUser = profile.users as { id: string; name: string; avatar_url: string | null };
      const embedding = embeddingsByUserId.get(profile.user_id);

      const candidate: EnhancedMatchCandidate = {
        userId: profile.user_id,
        name: candidateUser.name,
        department: profile.department,
        jobRole: profile.job_role,
        officeLocation: profile.office_location,
        mbti: profile.mbti || undefined,
        avatarUrl: candidateUser.avatar_url || undefined,
        hobbies: tagsByProfileId.get(profile.id) || [],
        embedding: parseEmbedding(embedding?.combined_embedding),
        collaborationStyleEmbedding: parseEmbedding(embedding?.collaboration_style_embedding),
        strengthsEmbedding: parseEmbedding(embedding?.strengths_embedding),
        preferredPeopleTypeEmbedding: parseEmbedding(embedding?.preferred_people_type_embedding),
      };

      // Respect visibility - only use public/department visible data for matching
      const visibility = profile.visibility_settings || {};

      // Filter out private fields from matching
      if (visibility.collaboration_style === "private") {
        candidate.collaborationStyleEmbedding = undefined;
      }
      if (visibility.strengths === "private") {
        candidate.strengthsEmbedding = undefined;
      }
      if (visibility.preferred_people_type === "private") {
        candidate.preferredPeopleTypeEmbedding = undefined;
      }

      // Use enhanced scoring with all 7 components
      const scores = calculateEnhancedMatchScore(
        currentUser,
        candidate,
        enhancedPreferences,
        weights
      );

      // Generate enhanced explanation
      const explanation = generateEnhancedExplanation(currentUser, candidate, scores);
      const conversationStarters = getConversationStarters(currentUser, candidate);

      return {
        candidate,
        scores,
        explanation,
        conversationStarters,
      };
    });

    // Sort by total score and take top N
    scoredCandidates.sort((a, b) => b.scores.totalScore - a.scores.totalScore);
    const topCandidates = scoredCandidates.slice(0, limit);

    // Format response with enhanced breakdown
    const recommendations = topCandidates.map((item) => ({
      user: {
        id: item.candidate.userId,
        name: item.candidate.name,
        department: item.candidate.department,
        jobRole: item.candidate.jobRole,
        officeLocation: item.candidate.officeLocation,
        mbti: item.candidate.mbti,
        avatarUrl: item.candidate.avatarUrl,
        hobbies: item.candidate.hobbies,
      },
      match: {
        totalScore: Math.round(item.scores.totalScore * 1000) / 1000,
        breakdown: {
          textSimilarity: Math.round(item.scores.embeddingSimilarity * 1000) / 1000,
          tagOverlap: Math.round(item.scores.tagOverlapScore * 1000) / 1000,
          mbtiCompatibility: Math.round(item.scores.mbtiCompatibilityScore * 1000) / 1000,
          jobRole: Math.round(item.scores.jobRoleScore * 1000) / 1000,
          department: Math.round(item.scores.departmentScore * 1000) / 1000,
          location: Math.round(item.scores.locationScore * 1000) / 1000,
          preferenceMatch: Math.round(item.scores.preferenceMatchScore * 1000) / 1000,
        },
        explanation: item.explanation,
        conversationStarters: item.conversationStarters,
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        meta: {
          generatedAt: new Date().toISOString(),
          nextRefreshAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          totalCandidates: typedCandidates.length,
        },
      },
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 태그 추천 API
 * Claude를 사용하여 프로필 컨텍스트 기반 태그 추천
 */

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  suggestHobbyTags,
  suggestRelatedTags,
  type ProfileContext,
} from "@/lib/anthropic/profileAssistant";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// POST /api/profile/suggest-tags
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
    const { existingTags = [], selectedTags = [], count = 5 } = body;

    // Validate count
    if (typeof count !== "number" || count < 1 || count > 10) {
      return NextResponse.json(
        { success: false, error: "추천 개수는 1-10 사이여야 합니다." },
        { status: 400 }
      );
    }

    // selectedTags가 있으면 연관 태그 추천 모드
    if (selectedTags.length > 0) {
      const result = await suggestRelatedTags(selectedTags, existingTags, count);

      if (!result) {
        return NextResponse.json(
          {
            success: false,
            error: "태그 추천 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          tags: result.tags,
          reasoning: result.reasoning,
        },
      });
    }

    // Get user's current profile for context
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { success: false, error: "프로필 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const profile = profileData as ProfileRow | null;

    // Build context from profile
    const context: ProfileContext = {
      department: profile?.department || undefined,
      jobRole: profile?.job_role || undefined,
      officeLocation: profile?.office_location || undefined,
      mbti: profile?.mbti || undefined,
      collaborationStyle: profile?.collaboration_style || undefined,
      strengths: profile?.strengths || undefined,
      preferredPeopleType: profile?.preferred_people_type || undefined,
      workDescription: profile?.work_description || undefined,
      techStack: profile?.tech_stack || undefined,
      interests: profile?.interests || undefined,
      careerGoals: profile?.career_goals || undefined,
      education: profile?.education || undefined,
    };

    // Get existing tags from profile_tags table if not provided
    let tagsToExclude = existingTags;
    if (tagsToExclude.length === 0 && profile?.id) {
      const { data: profileTags } = await supabase
        .from("profile_tags")
        .select("tag_name")
        .eq("profile_id", profile.id) as { data: { tag_name: string }[] | null };

      if (profileTags) {
        tagsToExclude = profileTags.map((t) => t.tag_name);
      }
    }

    // Call Claude for tag suggestions
    const result = await suggestHobbyTags(context, tagsToExclude, count);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "태그 추천 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tags: result.tags,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    console.error("Tag suggestion API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 프로필 텍스트 생성 도움 API
 * Claude를 사용하여 프로필 필드 작성 도움
 */

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateProfileText,
  type ProfileContext,
  type ProfileFieldType,
} from "@/lib/anthropic/profileAssistant";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// 허용된 필드 타입
const ALLOWED_FIELD_TYPES: ProfileFieldType[] = [
  "collaborationStyle",
  "strengths",
  "preferredPeopleType",
  "workDescription",
  "careerGoals",
];

// POST /api/profile/generate-text
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
    const { fieldType, additionalContext } = body;

    // Validate field type
    if (!fieldType || !ALLOWED_FIELD_TYPES.includes(fieldType as ProfileFieldType)) {
      return NextResponse.json(
        {
          success: false,
          error: `유효하지 않은 필드 타입입니다. 허용된 타입: ${ALLOWED_FIELD_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
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

    // Get user's hobby tags
    let hobbies: string[] = [];
    if (profile?.id) {
      const { data: profileTags } = await supabase
        .from("profile_tags")
        .select("tag_name")
        .eq("profile_id", profile.id) as { data: { tag_name: string }[] | null };

      if (profileTags) {
        hobbies = profileTags.map((t) => t.tag_name);
      }
    }

    // Build context from profile and additional context
    const context: ProfileContext = {
      department: profile?.department || additionalContext?.department || undefined,
      jobRole: profile?.job_role || additionalContext?.jobRole || undefined,
      officeLocation: profile?.office_location || additionalContext?.officeLocation || undefined,
      mbti: profile?.mbti || additionalContext?.mbti || undefined,
      hobbies: hobbies.length > 0 ? hobbies : additionalContext?.hobbies || undefined,
      collaborationStyle: profile?.collaboration_style || additionalContext?.collaborationStyle || undefined,
      strengths: profile?.strengths || additionalContext?.strengths || undefined,
      preferredPeopleType: profile?.preferred_people_type || additionalContext?.preferredPeopleType || undefined,
      workDescription: profile?.work_description || additionalContext?.workDescription || undefined,
      techStack: profile?.tech_stack || additionalContext?.techStack || undefined,
      interests: profile?.interests || additionalContext?.interests || undefined,
      careerGoals: profile?.career_goals || additionalContext?.careerGoals || undefined,
      education: profile?.education || additionalContext?.education || undefined,
    };

    // Call Claude for text generation
    const result = await generateProfileText(fieldType as ProfileFieldType, context);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "텍스트 생성 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestion: result.suggestion,
        alternatives: result.alternatives || [],
      },
    });
  } catch (error) {
    console.error("Text generation API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

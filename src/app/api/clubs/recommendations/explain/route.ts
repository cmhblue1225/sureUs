import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  generateRecommendationExplanation,
  isAnthropicAvailable,
} from "@/lib/anthropic/client";

// POST /api/clubs/recommendations/explain - AI로 추천 이유 설명 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Check if Anthropic API is available
    if (!isAnthropicAvailable()) {
      return NextResponse.json(
        { success: false, error: "AI 기능을 사용할 수 없습니다." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { clubId, scoreBreakdown, matchedColleagueCount } = body;

    if (!clubId) {
      return NextResponse.json(
        { success: false, error: "동호회 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Get user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userProfile } = await (serviceClient
      .from("users")
      .select("name, hobby_tags")
      .eq("id", user.id)
      .single() as any);

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "프로필을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get club info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club } = await (serviceClient
      .from("clubs")
      .select("name, category, tags")
      .eq("id", clubId)
      .single() as any);

    if (!club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Generate explanation
    const explanation = await generateRecommendationExplanation(
      userProfile.name || "회원",
      userProfile.hobby_tags || [],
      club.name,
      club.category,
      club.tags || [],
      matchedColleagueCount || 0,
      scoreBreakdown || {
        tagMatch: 0,
        socialGraph: 0,
        memberComposition: 0,
        activityLevel: 0,
        categoryPreference: 0,
      }
    );

    if (!explanation) {
      // Fallback to basic explanation
      const reasons: string[] = [];
      if (scoreBreakdown?.tagMatch >= 0.3) {
        reasons.push("관심사가 비슷해요");
      }
      if (matchedColleagueCount > 0) {
        reasons.push(`추천 동료 ${matchedColleagueCount}명이 활동 중이에요`);
      }
      if (scoreBreakdown?.activityLevel >= 0.5) {
        reasons.push("활발한 동호회예요");
      }

      return NextResponse.json({
        success: true,
        data: {
          explanation: reasons.length > 0
            ? reasons.join(". ") + "."
            : `${club.name}을(를) 추천드려요!`,
          generated: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        explanation,
        generated: true,
      },
    });
  } catch (error) {
    console.error("Recommendation explain API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

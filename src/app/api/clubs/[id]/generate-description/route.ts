import { NextResponse, NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  generateClubDescription,
  isAnthropicAvailable,
} from "@/lib/anthropic/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/clubs/[id]/generate-description - AI로 동호회 설명 생성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clubId } = await params;
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
        { success: false, error: "AI 기능을 사용할 수 없습니다. 관리자에게 문의하세요." },
        { status: 503 }
      );
    }

    const serviceClient = createServiceClient();

    // Get club info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: club, error: clubError } = await (serviceClient
      .from("clubs")
      .select("name, category, tags, description, leader_id")
      .eq("id", clubId)
      .single() as any);

    if (clubError || !club) {
      return NextResponse.json(
        { success: false, error: "동호회를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Only leader can generate description
    if (club.leader_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "회장만 설명을 생성할 수 있습니다." },
        { status: 403 }
      );
    }

    // Generate description using Claude
    const generatedDescription = await generateClubDescription(
      club.name,
      club.category,
      club.tags || [],
      club.description
    );

    if (!generatedDescription) {
      return NextResponse.json(
        { success: false, error: "설명 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        description: generatedDescription,
      },
    });
  } catch (error) {
    console.error("Generate description API error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

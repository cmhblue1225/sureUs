import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic Claude 클라이언트
 * 동호회 설명 생성, 추천 이유 설명, 활동 요약 등에 사용
 */

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY is not set");
    return null;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return anthropicClient;
}

export interface GenerateTextOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `당신은 사내 소셜 네트워킹 서비스 'sureNet'의 AI 어시스턴트입니다.
친근하고 전문적인 톤으로 응답해주세요.
한국어로 응답합니다.`;

/**
 * Claude API를 사용하여 텍스트 생성
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {}
): Promise<string | null> {
  const client = getAnthropicClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature ?? 0.7,
      system: options.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text;
    }

    return null;
  } catch (error) {
    console.error("Anthropic API error:", error);
    return null;
  }
}

/**
 * 동호회 설명 생성
 */
export async function generateClubDescription(
  clubName: string,
  category: string,
  tags: string[],
  existingDescription?: string
): Promise<string | null> {
  const prompt = `사내 동호회 "${clubName}"의 소개글을 작성해주세요.

카테고리: ${category}
키워드: ${tags.join(", ") || "없음"}
${existingDescription ? `기존 설명: ${existingDescription}` : ""}

요구사항:
- 짧고 친근한 톤으로 200자 내외로 작성
- 회원들의 참여를 유도하는 내용
- 동호회의 특징과 장점 강조
- 이모지는 사용하지 마세요`;

  return generateText(prompt, {
    maxTokens: 300,
    temperature: 0.8,
    systemPrompt: `당신은 사내 동호회 소개글 작성을 돕는 AI입니다.
친근하고 열정적인 톤으로 작성해주세요.
한국어로 응답합니다.`,
  });
}

/**
 * 추천 이유 설명 생성
 */
export async function generateRecommendationExplanation(
  userName: string,
  userTags: string[],
  clubName: string,
  clubCategory: string,
  clubTags: string[],
  matchedColleagueCount: number,
  scoreBreakdown: {
    tagMatch: number;
    socialGraph: number;
    memberComposition: number;
    activityLevel: number;
    categoryPreference: number;
  }
): Promise<string | null> {
  const prompt = `${userName}님에게 "${clubName}" 동호회를 추천하는 이유를 2-3문장으로 설명해주세요.

사용자 관심사: ${userTags.join(", ") || "없음"}
동호회 카테고리: ${clubCategory}
동호회 태그: ${clubTags.join(", ") || "없음"}
추천 동료 활동 수: ${matchedColleagueCount}명

점수 분석:
- 관심사 일치도: ${Math.round(scoreBreakdown.tagMatch * 100)}%
- 소셜 연결: ${Math.round(scoreBreakdown.socialGraph * 100)}%
- 회원 성향 유사도: ${Math.round(scoreBreakdown.memberComposition * 100)}%
- 동호회 활동도: ${Math.round(scoreBreakdown.activityLevel * 100)}%

요구사항:
- 자연스럽고 개인화된 추천 이유
- 2-3문장으로 간결하게
- 구체적인 숫자보다는 자연스러운 표현 사용`;

  return generateText(prompt, {
    maxTokens: 200,
    temperature: 0.7,
  });
}

/**
 * 동호회 활동 요약 생성
 */
export async function generateActivitySummary(
  clubName: string,
  recentPostTitles: string[],
  totalPostsCount: number,
  totalChatMessages: number,
  activeMemberCount: number
): Promise<string | null> {
  const prompt = `"${clubName}" 동호회의 이번 주 활동을 요약해주세요.

최근 게시물 제목들:
${recentPostTitles.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join("\n")}

통계:
- 총 게시물 수: ${totalPostsCount}개
- 채팅 메시지 수: ${totalChatMessages}개
- 활동 회원 수: ${activeMemberCount}명

요구사항:
- 3-5문장으로 요약
- 주요 활동과 분위기 전달
- 친근한 톤으로 작성
- 개인정보는 포함하지 마세요`;

  return generateText(prompt, {
    maxTokens: 300,
    temperature: 0.7,
  });
}

/**
 * Anthropic API 사용 가능 여부 확인
 */
export function isAnthropicAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

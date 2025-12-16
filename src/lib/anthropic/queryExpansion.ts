/**
 * 의미 검색을 위한 Claude 쿼리 확장 모듈
 * 자연어 쿼리를 분석하여 구조화된 검색 조건으로 변환
 */

import { generateText, isAnthropicAvailable } from "./client";
import { HOBBY_TAGS } from "@/lib/constants/hobbyTags";

export interface ExpandedQuery {
  originalQuery: string;
  expandedDescription: string;
  suggestedMbtiTypes: string[];
  suggestedHobbyTags: string[];
  searchKeywords: string[];
  confidence: number;
}

const VALID_MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const QUERY_EXPANSION_SYSTEM_PROMPT = `당신은 사내 네트워킹 서비스의 동료 검색 어시스턴트입니다.
사용자의 자연어 검색 쿼리를 분석하여 구조화된 검색 조건을 추출합니다.
반드시 유효한 JSON 형식으로만 응답하세요.`;

/**
 * Claude를 사용하여 검색 쿼리 확장
 */
export async function expandSemanticQuery(
  query: string
): Promise<ExpandedQuery | null> {
  // Claude 사용 불가 시 폴백
  if (!isAnthropicAvailable()) {
    return createFallbackExpansion(query);
  }

  const hobbyTagList = HOBBY_TAGS.join(", ");

  const prompt = `사용자가 동료를 찾기 위해 다음과 같이 검색했습니다:
"${query}"

이 검색어를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "expandedDescription": "검색 의도를 협업 스타일, 성격, 업무 방식 관점에서 확장한 설명 (50-100자)",
  "suggestedMbtiTypes": ["관련 MBTI 유형 최대 4개"],
  "suggestedHobbyTags": ["관련될 수 있는 취미 태그 최대 5개"],
  "searchKeywords": ["추가 검색 키워드 최대 5개"]
}

참고사항:
- MBTI 유형은 다음 중에서만 선택: ${VALID_MBTI_TYPES.join(", ")}
- 취미 태그는 다음 목록에서 관련 있는 것만 선택: ${hobbyTagList}
- 검색어가 모호하면 가장 가능성 높은 해석을 사용
- JSON만 출력하고 다른 텍스트는 포함하지 마세요`;

  try {
    const response = await generateText(prompt, {
      maxTokens: 400,
      temperature: 0.3, // 낮은 temperature로 일관된 JSON 출력
      systemPrompt: QUERY_EXPANSION_SYSTEM_PROMPT,
    });

    if (!response) {
      return createFallbackExpansion(query);
    }

    // JSON 파싱 시도
    const parsed = parseJsonResponse(response);
    if (!parsed) {
      console.warn("Failed to parse Claude response, using fallback");
      return createFallbackExpansion(query);
    }

    // 응답 검증 및 정규화
    return {
      originalQuery: query,
      expandedDescription: parsed.expandedDescription || query,
      suggestedMbtiTypes: validateMbtiTypes(parsed.suggestedMbtiTypes || []),
      suggestedHobbyTags: validateHobbyTags(parsed.suggestedHobbyTags || []),
      searchKeywords: (parsed.searchKeywords || []).slice(0, 5),
      confidence: 0.85,
    };
  } catch (error) {
    console.error("Query expansion error:", error);
    return createFallbackExpansion(query);
  }
}

/**
 * JSON 응답 파싱 (코드 블록 제거 포함)
 */
function parseJsonResponse(response: string): {
  expandedDescription?: string;
  suggestedMbtiTypes?: string[];
  suggestedHobbyTags?: string[];
  searchKeywords?: string[];
} | null {
  try {
    // 코드 블록 제거
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    return JSON.parse(jsonStr);
  } catch {
    // JSON 부분만 추출 시도
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * MBTI 유형 검증
 */
function validateMbtiTypes(types: string[]): string[] {
  return types
    .map((t) => t.toUpperCase().trim())
    .filter((t) => VALID_MBTI_TYPES.includes(t))
    .slice(0, 4);
}

/**
 * 취미 태그 검증
 */
function validateHobbyTags(tags: string[]): string[] {
  const validTags = new Set(HOBBY_TAGS as readonly string[]);
  return tags.filter((t) => validTags.has(t)).slice(0, 5);
}

/**
 * Claude 미사용 시 폴백 확장
 */
function createFallbackExpansion(query: string): ExpandedQuery {
  const queryLower = query.toLowerCase();
  const keywords = query.split(/\s+/).filter((k) => k.length > 1);

  // 간단한 키워드 기반 태그 추론
  const matchedTags = HOBBY_TAGS.filter(
    (tag) =>
      queryLower.includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(queryLower)
  );

  // 간단한 성격 키워드 → MBTI 매핑
  const mbtiHints: string[] = [];
  if (
    queryLower.includes("외향") ||
    queryLower.includes("활발") ||
    queryLower.includes("쾌활")
  ) {
    mbtiHints.push("ENFP", "ESFP", "ENFJ");
  }
  if (
    queryLower.includes("내향") ||
    queryLower.includes("조용") ||
    queryLower.includes("차분")
  ) {
    mbtiHints.push("INFP", "INFJ", "ISFJ");
  }
  if (
    queryLower.includes("논리") ||
    queryLower.includes("분석") ||
    queryLower.includes("체계")
  ) {
    mbtiHints.push("INTJ", "INTP", "ISTJ");
  }
  if (
    queryLower.includes("창의") ||
    queryLower.includes("아이디어") ||
    queryLower.includes("혁신")
  ) {
    mbtiHints.push("ENTP", "ENFP", "INFP");
  }

  return {
    originalQuery: query,
    expandedDescription: query,
    suggestedMbtiTypes: [...new Set(mbtiHints)].slice(0, 4),
    suggestedHobbyTags: matchedTags.slice(0, 5),
    searchKeywords: keywords.slice(0, 5),
    confidence: 0.3,
  };
}

/**
 * 확장된 쿼리를 검색용 텍스트로 변환
 */
export function expandedQueryToSearchText(expanded: ExpandedQuery): string {
  const parts = [
    expanded.expandedDescription,
    ...expanded.searchKeywords,
  ];

  // MBTI 유형에 대한 설명 추가
  if (expanded.suggestedMbtiTypes.length > 0) {
    parts.push(`MBTI 유형: ${expanded.suggestedMbtiTypes.join(", ")}`);
  }

  // 취미 태그 추가
  if (expanded.suggestedHobbyTags.length > 0) {
    parts.push(`관심사: ${expanded.suggestedHobbyTags.join(", ")}`);
  }

  return parts.join(". ");
}

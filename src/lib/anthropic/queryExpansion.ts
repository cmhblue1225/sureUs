/**
 * 의미 검색을 위한 Claude 쿼리 확장 모듈
 * 자연어 쿼리를 분석하여 구조화된 검색 조건으로 변환
 */

import { generateText, isAnthropicAvailable } from "./client";
import { HOBBY_TAGS } from "@/lib/constants/hobbyTags";

export interface ProfileFieldHints {
  collaborationStyle: string[];
  strengths: string[];
  preferredPeopleType: string[];
}

export interface ExpandedQuery {
  originalQuery: string;
  expandedDescription: string;
  suggestedMbtiTypes: string[];
  suggestedHobbyTags: string[];
  searchKeywords: string[];
  profileFieldHints: ProfileFieldHints;
  confidence: number;
}

const VALID_MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const QUERY_EXPANSION_SYSTEM_PROMPT = `당신은 사내 네트워킹 서비스의 동료 검색 어시스턴트입니다.
사용자의 검색 쿼리를 분석하여 프로필의 협업 스타일, 강점, 선호하는 동료 유형 필드와 매칭될 수 있는 키워드를 추출합니다.
확장은 최소화하고, 사용자가 입력한 의미를 최대한 보존하세요.
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

프로필에는 다음 필드가 있습니다:
- 협업 스타일 (collaboration_style): 팀원과 어떻게 일하는지
- 강점/장점 (strengths): 본인의 업무적 강점
- 선호하는 동료 유형 (preferred_people_type): 함께 일하고 싶은 동료 유형

검색어를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "expandedDescription": "검색 의도를 그대로 유지한 간결한 설명 (원래 쿼리와 최대한 동일하게)",
  "suggestedMbtiTypes": ["직접 언급된 경우에만 MBTI 유형 추가, 없으면 빈 배열"],
  "suggestedHobbyTags": ["직접 언급된 취미만 추가, 없으면 빈 배열"],
  "searchKeywords": ["협업 스타일/강점/선호 동료 필드에서 찾을 핵심 키워드 (최대 3개)"],
  "profileFieldHints": {
    "collaborationStyle": ["협업 스타일 필드에서 찾을 키워드"],
    "strengths": ["강점 필드에서 찾을 키워드"],
    "preferredPeopleType": ["선호 동료 필드에서 찾을 키워드"]
  }
}

중요 규칙:
- 사용자가 명시하지 않은 MBTI나 취미를 추측하지 마세요
- 확장 대신 원래 쿼리의 핵심 의미를 보존하세요
- profileFieldHints에 각 프로필 필드와 매칭될 수 있는 키워드를 구체적으로 추출하세요
- MBTI 유형 목록: ${VALID_MBTI_TYPES.join(", ")}
- 취미 태그 목록: ${hobbyTagList}
- JSON만 출력하세요`;

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
    const profileFieldHints: ProfileFieldHints = {
      collaborationStyle: (parsed.profileFieldHints?.collaborationStyle || []).slice(0, 5),
      strengths: (parsed.profileFieldHints?.strengths || []).slice(0, 5),
      preferredPeopleType: (parsed.profileFieldHints?.preferredPeopleType || []).slice(0, 5),
    };

    return {
      originalQuery: query,
      expandedDescription: parsed.expandedDescription || query,
      suggestedMbtiTypes: validateMbtiTypes(parsed.suggestedMbtiTypes || []),
      suggestedHobbyTags: validateHobbyTags(parsed.suggestedHobbyTags || []),
      searchKeywords: (parsed.searchKeywords || []).slice(0, 3),
      profileFieldHints,
      confidence: 0.9, // 프로필 필드 중심이므로 신뢰도 상향
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
  profileFieldHints?: {
    collaborationStyle?: string[];
    strengths?: string[];
    preferredPeopleType?: string[];
  };
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
 * 확장을 최소화하고 원래 쿼리의 키워드만 사용
 */
function createFallbackExpansion(query: string): ExpandedQuery {
  const queryLower = query.toLowerCase();
  const keywords = query.split(/\s+/).filter((k) => k.length > 1);

  // 직접 언급된 태그만 추출 (확장하지 않음)
  const matchedTags = HOBBY_TAGS.filter((tag) =>
    queryLower.includes(tag.toLowerCase())
  );

  // MBTI가 직접 언급된 경우에만 추출
  const mbtiHints: string[] = [];
  for (const mbti of VALID_MBTI_TYPES) {
    if (queryLower.includes(mbti.toLowerCase())) {
      mbtiHints.push(mbti);
    }
  }

  return {
    originalQuery: query,
    expandedDescription: query,
    suggestedMbtiTypes: mbtiHints.slice(0, 2),
    suggestedHobbyTags: matchedTags.slice(0, 3),
    searchKeywords: keywords.slice(0, 3),
    profileFieldHints: {
      // 원래 키워드를 모든 프로필 필드에서 검색
      collaborationStyle: keywords,
      strengths: keywords,
      preferredPeopleType: keywords,
    },
    confidence: 0.5,
  };
}

/**
 * 정확 검색 모드용 쿼리 생성
 * LLM 확장 없이 사용자 입력 키워드만 사용하여 직접 매칭
 */
export function createExactSearchQuery(query: string): ExpandedQuery {
  // 키워드 추출 (공백 기준 분리, 1자 이상)
  const keywords = query
    .split(/\s+/)
    .filter((k) => k.length > 0)
    .map((k) => k.trim());

  // 직접 언급된 MBTI만 추출
  const queryLower = query.toLowerCase();
  const matchedMbti: string[] = [];
  for (const mbti of VALID_MBTI_TYPES) {
    if (queryLower.includes(mbti.toLowerCase())) {
      matchedMbti.push(mbti);
    }
  }

  // 직접 언급된 태그만 추출
  const matchedTags = HOBBY_TAGS.filter((tag) =>
    queryLower.includes(tag.toLowerCase())
  );

  return {
    originalQuery: query,
    expandedDescription: query, // 확장 없이 원본 그대로
    suggestedMbtiTypes: matchedMbti, // 직접 언급된 MBTI만
    suggestedHobbyTags: matchedTags, // 직접 언급된 태그만
    searchKeywords: keywords, // 원본 키워드 전체
    profileFieldHints: {
      // 모든 프로필 필드에서 원본 키워드 검색
      collaborationStyle: keywords,
      strengths: keywords,
      preferredPeopleType: keywords,
    },
    confidence: 1.0, // 정확 모드는 신뢰도 100%
  };
}

/**
 * 확장된 쿼리를 검색용 텍스트로 변환
 * 원래 쿼리를 최대한 보존하고 최소한의 확장만 적용
 */
export function expandedQueryToSearchText(expanded: ExpandedQuery): string {
  // 원래 쿼리와 프로필 필드 힌트 중심으로 구성
  const parts = [expanded.originalQuery];

  // 프로필 필드 힌트 추가 (가장 중요)
  const allHints = [
    ...expanded.profileFieldHints.collaborationStyle,
    ...expanded.profileFieldHints.strengths,
    ...expanded.profileFieldHints.preferredPeopleType,
  ];
  const uniqueHints = [...new Set(allHints)];
  if (uniqueHints.length > 0) {
    parts.push(uniqueHints.join(" "));
  }

  return parts.join(". ");
}

/**
 * 의미 검색을 위한 Claude 쿼리 확장 모듈
 * 자연어 쿼리를 분석하여 구조화된 검색 조건으로 변환
 */

import { generateText, isAnthropicAvailable } from "./client";
import { HOBBY_TAGS } from "@/lib/constants/hobbyTags";

/**
 * 쿼리 의도 유형
 * - personality: 성격/협업 스타일 관련 ("밝은 사람", "꼼꼼한")
 * - skill: 기술/역량 관련 ("개발자", "React 잘하는")
 * - hobby: 취미/관심사 관련 ("게임 좋아하는", "운동하는")
 * - mbti: MBTI 관련 ("INTJ", "외향적인")
 * - department: 부서/조직 관련 ("Frontend팀", "연구소")
 * - general: 일반적인 검색
 */
export type QueryIntent = 'personality' | 'skill' | 'hobby' | 'mbti' | 'department' | 'general';

/**
 * 검색 전략 유형
 * - text_heavy: 텍스트 매칭 가중치 높음 (짧은 쿼리, 특정 키워드)
 * - balanced: 균형 잡힌 가중치 (일반적인 쿼리)
 * - vector_heavy: 벡터 유사도 가중치 높음 (서술형 쿼리)
 */
export type SearchStrategy = 'text_heavy' | 'balanced' | 'vector_heavy';

/**
 * 쿼리 분석 결과
 */
export interface QueryAnalysis {
  queryLength: 'short' | 'medium' | 'long';
  hasSpecificKeywords: boolean;
  hasDescriptiveTerms: boolean;
  suggestedStrategy: SearchStrategy;
}

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
  // 쿼리 의도 분류
  queryIntent: QueryIntent;
  intentConfidence: number;
}

const VALID_MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const QUERY_EXPANSION_SYSTEM_PROMPT = `당신은 사내 네트워킹 서비스의 동료 검색 어시스턴트입니다.
사용자의 검색 쿼리를 분석하여:
1. 쿼리의 의도(intent)를 분류합니다
2. 프로필의 협업 스타일, 강점, 선호하는 동료 유형 필드와 매칭될 수 있는 키워드를 추출합니다

확장은 최소화하고, 사용자가 입력한 의미를 최대한 보존하세요.
반드시 유효한 JSON 형식으로만 응답하세요.`;

// 의도 분류를 위한 키워드 패턴
const INTENT_PATTERNS: Record<QueryIntent, string[]> = {
  personality: ['밝은', '활발', '꼼꼼', '성실', '책임감', '소통', '협력', '적극', '친절', '유쾌', '긍정', '섬세'],
  skill: ['개발', '프로그래밍', 'react', 'vue', 'python', 'java', '기술', '설계', '분석', '디자인', '엔지니어', 'backend', 'frontend'],
  hobby: ['취미', '좋아하', '즐기', '운동', '게임', '영화', '음악', '여행', '독서', '등산', '요리'],
  mbti: ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp', '외향', '내향'],
  department: ['팀', '부서', '그룹', '본부', '연구소', '개발팀', '디자인팀', '마케팅', '영업'],
  general: [],
};

/**
 * 쿼리에서 의도를 분류하는 함수 (규칙 기반)
 */
function classifyQueryIntent(query: string): { intent: QueryIntent; confidence: number } {
  const queryLower = query.toLowerCase();
  const scores: Record<QueryIntent, number> = {
    personality: 0,
    skill: 0,
    hobby: 0,
    mbti: 0,
    department: 0,
    general: 0,
  };

  // 각 의도별 키워드 매칭 점수 계산
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [QueryIntent, string[]][]) {
    for (const pattern of patterns) {
      if (queryLower.includes(pattern.toLowerCase())) {
        scores[intent] += 1;
      }
    }
  }

  // 최고 점수 의도 찾기
  let maxScore = 0;
  let maxIntent: QueryIntent = 'general';
  for (const [intent, score] of Object.entries(scores) as [QueryIntent, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent;
    }
  }

  // 매칭된 키워드가 없으면 general
  if (maxScore === 0) {
    return { intent: 'general', confidence: 0.5 };
  }

  // 신뢰도 계산 (최대 3개 매칭 시 1.0)
  const confidence = Math.min(0.5 + maxScore * 0.2, 1.0);
  return { intent: maxIntent, confidence };
}

// 특정 키워드 패턴 (텍스트 매칭 우선)
const SPECIFIC_KEYWORDS_PATTERNS = [
  // MBTI
  ...VALID_MBTI_TYPES.map(m => m.toLowerCase()),
  // 기술 스택
  'react', 'vue', 'angular', 'typescript', 'javascript', 'python', 'java', 'node', 'kotlin', 'swift', 'go', 'rust',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'sql', 'graphql', 'next', 'spring',
  // 부서/조직
  '프론트엔드', '백엔드', '풀스택', 'frontend', 'backend', 'devops', 'qa', 'pm', '디자인', '마케팅',
  // 위치
  '판교', '강남', '재택', '원격', 'remote',
];

// 서술형 키워드 패턴 (벡터 매칭 우선)
const DESCRIPTIVE_PATTERNS = [
  '같은', '사람', '분', '스타일', '느낌', '비슷한', '정도', '좋아하', '원하', '있는', '하는',
  '찾고', '싶은', '되는', '할 수', '잘하', '못하',
];

/**
 * 쿼리를 분석하여 최적의 검색 전략 결정
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const queryLower = query.toLowerCase();
  const words = query.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // 쿼리 길이 분류
  let queryLength: 'short' | 'medium' | 'long';
  if (wordCount <= 2) {
    queryLength = 'short';
  } else if (wordCount <= 5) {
    queryLength = 'medium';
  } else {
    queryLength = 'long';
  }

  // 특정 키워드 존재 여부
  const hasSpecificKeywords = SPECIFIC_KEYWORDS_PATTERNS.some(pattern =>
    queryLower.includes(pattern)
  );

  // 서술형 표현 존재 여부
  const hasDescriptiveTerms = DESCRIPTIVE_PATTERNS.some(pattern =>
    queryLower.includes(pattern)
  );

  // 전략 결정
  let suggestedStrategy: SearchStrategy;

  if (queryLength === 'short' || hasSpecificKeywords) {
    // 짧은 쿼리나 특정 키워드가 있으면 텍스트 매칭 우선
    suggestedStrategy = 'text_heavy';
  } else if (queryLength === 'long' || hasDescriptiveTerms) {
    // 긴 쿼리나 서술형 표현이 있으면 벡터 우선
    suggestedStrategy = 'vector_heavy';
  } else {
    // 기본은 균형 잡힌 전략
    suggestedStrategy = 'balanced';
  }

  return {
    queryLength,
    hasSpecificKeywords,
    hasDescriptiveTerms,
    suggestedStrategy,
  };
}

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
- 업무 설명 (work_description): 현재 담당 업무
- 기술 스택 (tech_stack): 사용 기술
- 관심 분야 (interests): 관심사

검색어를 분석하여 다음 JSON 형식으로 응답해주세요:

{
  "queryIntent": "검색 의도 분류 (personality/skill/hobby/mbti/department/general 중 하나)",
  "expandedDescription": "검색 의도를 그대로 유지한 간결한 설명 (원래 쿼리와 최대한 동일하게)",
  "suggestedMbtiTypes": ["직접 언급된 경우에만 MBTI 유형 추가, 없으면 빈 배열"],
  "suggestedHobbyTags": ["직접 언급된 취미만 추가, 없으면 빈 배열"],
  "searchKeywords": ["협업 스타일/강점/선호 동료 필드에서 찾을 핵심 키워드 (최대 5개)"],
  "profileFieldHints": {
    "collaborationStyle": ["협업 스타일 필드에서 찾을 키워드"],
    "strengths": ["강점 필드에서 찾을 키워드"],
    "preferredPeopleType": ["선호 동료 필드에서 찾을 키워드"]
  }
}

의도 분류 기준:
- personality: 성격, 협업 스타일, 태도 관련 ("밝은", "꼼꼼한", "책임감")
- skill: 기술, 역량, 직무 관련 ("개발자", "React", "분석")
- hobby: 취미, 관심사 관련 ("게임", "운동", "여행")
- mbti: MBTI 유형 관련 ("INTJ", "외향적인")
- department: 부서, 조직 관련 ("개발팀", "연구소")
- general: 위에 해당하지 않는 일반 검색

중요 규칙:
- 사용자가 명시하지 않은 MBTI나 취미를 추측하지 마세요
- 확장 대신 원래 쿼리의 핵심 의미를 보존하세요
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

    // Claude 응답에서 의도 분류 추출, 없으면 규칙 기반 분류 사용
    let queryIntent: QueryIntent = 'general';
    let intentConfidence = 0.5;

    if (parsed.queryIntent && isValidIntent(parsed.queryIntent)) {
      queryIntent = parsed.queryIntent as QueryIntent;
      intentConfidence = 0.9; // Claude가 분류한 경우 높은 신뢰도
    } else {
      // 규칙 기반 분류 사용
      const ruleBasedIntent = classifyQueryIntent(query);
      queryIntent = ruleBasedIntent.intent;
      intentConfidence = ruleBasedIntent.confidence;
    }

    return {
      originalQuery: query,
      expandedDescription: parsed.expandedDescription || query,
      suggestedMbtiTypes: validateMbtiTypes(parsed.suggestedMbtiTypes || []),
      suggestedHobbyTags: validateHobbyTags(parsed.suggestedHobbyTags || []),
      searchKeywords: (parsed.searchKeywords || []).slice(0, 5),
      profileFieldHints,
      confidence: 0.9,
      queryIntent,
      intentConfidence,
    };
  } catch (error) {
    console.error("Query expansion error:", error);
    return createFallbackExpansion(query);
  }
}

/**
 * 유효한 의도인지 확인
 */
function isValidIntent(intent: string): intent is QueryIntent {
  return ['personality', 'skill', 'hobby', 'mbti', 'department', 'general'].includes(intent);
}

/**
 * JSON 응답 파싱 (코드 블록 제거 포함)
 */
function parseJsonResponse(response: string): {
  queryIntent?: string;
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

  // 규칙 기반 의도 분류
  const { intent, confidence: intentConfidence } = classifyQueryIntent(query);

  return {
    originalQuery: query,
    expandedDescription: query,
    suggestedMbtiTypes: mbtiHints.slice(0, 2),
    suggestedHobbyTags: matchedTags.slice(0, 3),
    searchKeywords: keywords.slice(0, 5),
    profileFieldHints: {
      // 원래 키워드를 모든 프로필 필드에서 검색
      collaborationStyle: keywords,
      strengths: keywords,
      preferredPeopleType: keywords,
    },
    confidence: 0.5,
    queryIntent: intent,
    intentConfidence,
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

  // 규칙 기반 의도 분류
  const { intent, confidence: intentConfidence } = classifyQueryIntent(query);

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
    queryIntent: intent,
    intentConfidence,
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

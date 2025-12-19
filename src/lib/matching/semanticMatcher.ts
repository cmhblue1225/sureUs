/**
 * 의미 검색을 위한 하이브리드 매칭 모듈
 * 벡터 유사도 + MBTI + 태그 매칭을 결합
 * 쿼리 의도에 따라 동적 가중치 적용
 */

import { cosineSimilarity } from "@/lib/openai/embeddings";
import type { ExpandedQuery, QueryIntent, SearchStrategy } from "@/lib/anthropic/queryExpansion";
import { expandKeywords } from "./koreanMatcher";

export interface SemanticSearchCandidate {
  userId: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];
  collaborationStyle?: string;
  strengths?: string;
  preferredPeopleType?: string;
  // 새 필드
  livingLocation?: string;
  hometown?: string;
  education?: string;
  workDescription?: string;
  techStack?: string;
  favoriteFood?: string;
  ageRange?: string;
  interests?: string;
  careerGoals?: string;
  certifications?: string;
  languages?: string;
  // 임베딩
  embedding?: number[];
}

export interface SemanticSearchResult {
  userId: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];

  // 점수
  semanticScore: number;
  profileFieldScore: number;
  mbtiMatchScore: number;
  tagMatchScore: number;
  textMatchScore: number;
  totalScore: number;

  // 매칭 이유
  matchReasons: string[];
}

export interface SemanticSearchOptions {
  expandedQuery: ExpandedQuery;
  queryEmbedding: number[];
  limit?: number;
  minScore?: number;
  searchStrategy?: SearchStrategy;
}

// 기본 점수 가중치 (balanced 전략과 동일)
const DEFAULT_WEIGHTS = {
  vectorSimilarity: 0.25,
  profileFieldMatch: 0.30,
  mbtiMatch: 0.10,
  tagMatch: 0.10,
  textMatch: 0.25,  // 텍스트 매칭 비중 대폭 상향
};

// 전략별 가중치 (검색 전략에 따라 동적 적용)
const STRATEGY_WEIGHTS: Record<SearchStrategy, typeof DEFAULT_WEIGHTS> = {
  // 텍스트 매칭 우선 (짧은 쿼리, 특정 키워드)
  text_heavy: {
    vectorSimilarity: 0.15,
    profileFieldMatch: 0.25,
    mbtiMatch: 0.10,
    tagMatch: 0.10,
    textMatch: 0.40,  // 핵심: 40%
  },
  // 균형 잡힌 가중치 (일반적인 쿼리)
  balanced: {
    vectorSimilarity: 0.25,
    profileFieldMatch: 0.30,
    mbtiMatch: 0.10,
    tagMatch: 0.10,
    textMatch: 0.25,  // 핵심: 25%
  },
  // 벡터 유사도 우선 (서술형 쿼리)
  vector_heavy: {
    vectorSimilarity: 0.40,
    profileFieldMatch: 0.30,
    mbtiMatch: 0.10,
    tagMatch: 0.10,
    textMatch: 0.10,
  },
};

// 의도별 동적 가중치 (텍스트 매칭 비중 전반적으로 상향)
const INTENT_WEIGHTS: Record<QueryIntent, typeof DEFAULT_WEIGHTS> = {
  // 성격/협업 스타일 검색: 프로필 필드 + 텍스트 매칭 강화
  personality: {
    vectorSimilarity: 0.20,
    profileFieldMatch: 0.40,
    mbtiMatch: 0.10,
    tagMatch: 0.05,
    textMatch: 0.25,  // 25%로 상향
  },
  // 기술/역량 검색: 텍스트 매칭 대폭 강화
  skill: {
    vectorSimilarity: 0.15,
    profileFieldMatch: 0.25,
    mbtiMatch: 0.05,
    tagMatch: 0.05,
    textMatch: 0.50,  // 50%로 대폭 상향 (기술 키워드 정확 매칭)
  },
  // 취미/관심사 검색: 태그 + 텍스트 매칭 강화
  hobby: {
    vectorSimilarity: 0.15,
    profileFieldMatch: 0.15,
    mbtiMatch: 0.05,
    tagMatch: 0.40,
    textMatch: 0.25,  // 25%로 상향
  },
  // MBTI 검색: MBTI 매칭 강화 (단, 텍스트 매칭도 유지)
  mbti: {
    vectorSimilarity: 0.10,
    profileFieldMatch: 0.15,
    mbtiMatch: 0.50,
    tagMatch: 0.05,
    textMatch: 0.20,  // 20%로 상향
  },
  // 부서/조직 검색: 텍스트 매칭 대폭 강화
  department: {
    vectorSimilarity: 0.10,
    profileFieldMatch: 0.20,
    mbtiMatch: 0.05,
    tagMatch: 0.05,
    textMatch: 0.60,  // 60%로 대폭 상향 (부서/직무명 정확 매칭)
  },
  // 일반 검색: 균형 잡힌 가중치
  general: DEFAULT_WEIGHTS,
};

/**
 * 전략과 의도에 따른 가중치 조회
 * 전략 가중치와 의도 가중치를 결합하여 최종 가중치 계산
 */
function getWeightsForStrategyAndIntent(
  strategy: SearchStrategy,
  intent: QueryIntent
): typeof DEFAULT_WEIGHTS {
  const strategyWeights = STRATEGY_WEIGHTS[strategy] || STRATEGY_WEIGHTS.balanced;
  const intentWeights = INTENT_WEIGHTS[intent] || DEFAULT_WEIGHTS;

  // 전략과 의도 가중치를 평균하여 결합 (전략 60%, 의도 40%)
  return {
    vectorSimilarity: strategyWeights.vectorSimilarity * 0.6 + intentWeights.vectorSimilarity * 0.4,
    profileFieldMatch: strategyWeights.profileFieldMatch * 0.6 + intentWeights.profileFieldMatch * 0.4,
    mbtiMatch: strategyWeights.mbtiMatch * 0.6 + intentWeights.mbtiMatch * 0.4,
    tagMatch: strategyWeights.tagMatch * 0.6 + intentWeights.tagMatch * 0.4,
    textMatch: strategyWeights.textMatch * 0.6 + intentWeights.textMatch * 0.4,
  };
}

/**
 * 하이브리드 의미 검색 수행
 */
export function performSemanticSearch(
  candidates: SemanticSearchCandidate[],
  options: SemanticSearchOptions
): SemanticSearchResult[] {
  const { expandedQuery, queryEmbedding, limit = 20, minScore = 0.1, searchStrategy = 'balanced' } = options;

  // 전략과 의도를 결합한 가중치 선택
  const queryIntent = expandedQuery.queryIntent || 'general';
  const weights = getWeightsForStrategyAndIntent(searchStrategy, queryIntent);

  const results: SemanticSearchResult[] = [];

  for (const candidate of candidates) {
    const scores = calculateSemanticScores(candidate, expandedQuery, queryEmbedding);
    const totalScore = calculateTotalScore(scores, weights);

    if (totalScore >= minScore) {
      const matchReasons = generateMatchReasons(candidate, expandedQuery, scores, queryIntent);

      results.push({
        userId: candidate.userId,
        name: candidate.name,
        department: candidate.department,
        jobRole: candidate.jobRole,
        officeLocation: candidate.officeLocation,
        mbti: candidate.mbti,
        avatarUrl: candidate.avatarUrl,
        hobbies: candidate.hobbies,
        semanticScore: scores.semanticScore,
        profileFieldScore: scores.profileFieldScore,
        mbtiMatchScore: scores.mbtiMatchScore,
        tagMatchScore: scores.tagMatchScore,
        textMatchScore: scores.textMatchScore,
        totalScore,
        matchReasons,
      });
    }
  }

  // 점수 기준 내림차순 정렬
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results.slice(0, limit);
}

interface SemanticScores {
  semanticScore: number;
  profileFieldScore: number;
  mbtiMatchScore: number;
  tagMatchScore: number;
  textMatchScore: number;
}

/**
 * 개별 점수 계산
 */
function calculateSemanticScores(
  candidate: SemanticSearchCandidate,
  expandedQuery: ExpandedQuery,
  queryEmbedding: number[]
): SemanticScores {
  // 1. 벡터 유사도 (임베딩 기반)
  let semanticScore = 0;
  if (candidate.embedding && candidate.embedding.length === queryEmbedding.length) {
    const rawSimilarity = cosineSimilarity(queryEmbedding, candidate.embedding);
    // 코사인 유사도를 0-1 범위로 정규화 (원래 -1~1)
    semanticScore = (rawSimilarity + 1) / 2;
  }

  // 2. 프로필 필드 직접 매칭 (가장 중요!)
  const profileFieldScore = calculateProfileFieldScore(
    candidate,
    expandedQuery.profileFieldHints,
    expandedQuery.queryIntent
  );

  // 3. MBTI 매칭 (직접 언급된 경우에만 의미 있음, 의도별 대체 점수)
  const mbtiMatchScore = calculateMbtiMatchScore(
    candidate.mbti,
    expandedQuery.suggestedMbtiTypes,
    expandedQuery.queryIntent
  );

  // 4. 태그 매칭 (취미 태그 - 직접 언급된 경우에만, 의도별 대체 점수)
  const tagMatchScore = calculateTagMatchScore(
    candidate.hobbies,
    expandedQuery.suggestedHobbyTags,
    expandedQuery.queryIntent
  );

  // 5. 텍스트 매칭 (키워드 기반)
  const textMatchScore = calculateTextMatchScore(
    candidate,
    expandedQuery.searchKeywords
  );

  return {
    semanticScore,
    profileFieldScore,
    mbtiMatchScore,
    tagMatchScore,
    textMatchScore,
  };
}

/**
 * 프로필 필드 직접 매칭 점수
 * 모든 프로필 필드에서 키워드 매칭 (의도에 따라 가중치 조정)
 */
function calculateProfileFieldScore(
  candidate: SemanticSearchCandidate,
  hints: ExpandedQuery["profileFieldHints"],
  queryIntent?: QueryIntent
): number {
  let totalScore = 0;
  let matchedFieldCount = 0;
  let totalFieldCount = 0;

  // 모든 키워드 통합
  const allKeywords = [
    ...hints.collaborationStyle,
    ...hints.strengths,
    ...hints.preferredPeopleType,
  ];

  if (allKeywords.length === 0) {
    return 0;
  }

  // 필드별 가중치 정의 (의도에 따라 조정)
  interface FieldConfig {
    text: string | undefined;
    weight: number;
  }

  const getFieldWeight = (baseWeight: number, intentBoost: QueryIntent[]): number => {
    return queryIntent && intentBoost.includes(queryIntent) ? baseWeight * 1.5 : baseWeight;
  };

  // 모든 프로필 필드를 검색 대상으로 (항상 모든 필드 검색)
  const allFields: FieldConfig[] = [
    // 핵심 필드 (가중치 높음)
    { text: candidate.collaborationStyle, weight: getFieldWeight(1.5, ['personality']) },
    { text: candidate.strengths, weight: getFieldWeight(1.5, ['personality', 'skill']) },
    { text: candidate.preferredPeopleType, weight: getFieldWeight(1.3, ['personality']) },
    // 기술/업무 관련 (skill 의도에서 가중치 상향)
    { text: candidate.techStack, weight: getFieldWeight(1.5, ['skill']) },
    { text: candidate.workDescription, weight: getFieldWeight(1.3, ['skill']) },
    { text: candidate.certifications, weight: getFieldWeight(1.2, ['skill']) },
    // 관심사/취미 관련 (hobby 의도에서 가중치 상향)
    { text: candidate.interests, weight: getFieldWeight(1.3, ['hobby']) },
    { text: candidate.favoriteFood, weight: getFieldWeight(1.0, ['hobby']) },
    { text: candidate.careerGoals, weight: getFieldWeight(1.2, ['personality', 'skill']) },
    // 위치/조직 관련 (department 의도에서 가중치 상향)
    { text: candidate.department, weight: getFieldWeight(1.5, ['department']) },
    { text: candidate.jobRole, weight: getFieldWeight(1.5, ['department', 'skill']) },
    { text: candidate.officeLocation, weight: getFieldWeight(1.3, ['department']) },
    { text: candidate.livingLocation, weight: getFieldWeight(1.0, ['department']) },
    { text: candidate.hometown, weight: getFieldWeight(0.8, []) },
    // 기타 필드
    { text: candidate.education, weight: getFieldWeight(1.0, ['skill']) },
    { text: candidate.ageRange, weight: getFieldWeight(0.5, []) },
    { text: candidate.languages, weight: getFieldWeight(1.0, ['skill']) },
    // 취미 배열도 검색 (문자열로 변환)
    { text: candidate.hobbies.join(' '), weight: getFieldWeight(1.3, ['hobby']) },
  ];

  // 각 필드에서 키워드 매칭
  for (const field of allFields) {
    if (field.text && field.text.length > 0) {
      totalFieldCount++;
      const fieldTextLower = field.text.toLowerCase();

      // 각 키워드에 대해 매칭 확인
      const matchedKeywords = allKeywords.filter((keyword) =>
        fieldTextLower.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        // 매칭된 키워드 비율 × 필드 가중치
        const matchRatio = matchedKeywords.length / allKeywords.length;
        totalScore += matchRatio * field.weight;
        matchedFieldCount++;
      }
    }
  }

  // 필드가 매칭되지 않은 경우
  if (matchedFieldCount === 0) {
    return 0;
  }

  // 정규화: 매칭된 필드 수와 점수 합계 기반
  // 최대 점수는 모든 필드에서 모든 키워드가 매칭된 경우
  const maxPossibleScore = allFields.reduce((sum, f) => sum + (f.text ? f.weight : 0), 0);
  const normalizedScore = totalScore / Math.max(maxPossibleScore * 0.3, 1); // 30% 이상 매칭 시 1.0

  return Math.min(normalizedScore, 1.0);
}

/**
 * MBTI 매칭 점수 (의도 기반 대체 점수 포함)
 */
function calculateMbtiMatchScore(
  candidateMbti: string | undefined,
  suggestedTypes: string[],
  queryIntent?: QueryIntent
): number {
  // MBTI가 없는 후보
  if (!candidateMbti) {
    return 0;
  }

  const upperMbti = candidateMbti.toUpperCase();

  // 쿼리에서 MBTI가 명시되지 않은 경우
  if (suggestedTypes.length === 0) {
    // personality 또는 mbti 의도일 때: MBTI가 있는 것 자체에 기본 점수 부여
    if (queryIntent === 'personality' || queryIntent === 'mbti') {
      return 0.3; // 기본 보너스
    }
    return 0;
  }

  // 정확히 일치
  if (suggestedTypes.includes(upperMbti)) {
    return 1.0;
  }

  // 유사 유형 체크 (3글자 일치)
  for (const suggested of suggestedTypes) {
    let matchCount = 0;
    for (let i = 0; i < 4; i++) {
      if (upperMbti[i] === suggested[i]) {
        matchCount++;
      }
    }
    if (matchCount >= 3) {
      return 0.7;
    }
  }

  // E/I, N/S 첫 글자만 일치
  const firstLetterMatches = suggestedTypes.some(
    (s) => s[0] === upperMbti[0]
  );
  if (firstLetterMatches) {
    return 0.3;
  }

  return 0;
}

/**
 * 태그 매칭 점수 (Jaccard 유사도 + 의도 기반 대체 점수)
 */
function calculateTagMatchScore(
  candidateTags: string[],
  suggestedTags: string[],
  queryIntent?: QueryIntent
): number {
  // 후보에 태그가 없음
  if (candidateTags.length === 0) {
    return 0;
  }

  // 쿼리에서 태그가 명시되지 않은 경우
  if (suggestedTags.length === 0) {
    // hobby 의도일 때: 태그가 있는 것 자체에 기본 점수 부여
    if (queryIntent === 'hobby') {
      return 0.2; // 기본 보너스 (태그 개수에 따라)
    }
    return 0;
  }

  const candidateSet = new Set(candidateTags.map((t) => t.toLowerCase()));
  const suggestedSet = new Set(suggestedTags.map((t) => t.toLowerCase()));

  let intersection = 0;
  for (const tag of suggestedSet) {
    if (candidateSet.has(tag)) {
      intersection++;
    }
  }

  if (intersection === 0) {
    return 0;
  }

  // Jaccard similarity
  const union = candidateSet.size + suggestedSet.size - intersection;
  return intersection / union;
}

/**
 * 텍스트 매칭 점수 (키워드 기반 + 유의어 확장)
 * 모든 프로필 필드에서 직접 키워드 매칭
 */
function calculateTextMatchScore(
  candidate: SemanticSearchCandidate,
  keywords: string[]
): number {
  if (keywords.length === 0) {
    return 0;
  }

  // 검색 대상 텍스트 결합 (모든 필드 포함)
  const searchableText = [
    // 기본 정보
    candidate.name,
    candidate.department,
    candidate.jobRole,
    candidate.officeLocation,
    candidate.mbti || "",
    // 핵심 필드
    candidate.collaborationStyle || "",
    candidate.strengths || "",
    candidate.preferredPeopleType || "",
    // 기술/업무
    candidate.workDescription || "",
    candidate.techStack || "",
    candidate.certifications || "",
    // 관심사/취미
    candidate.interests || "",
    candidate.favoriteFood || "",
    candidate.careerGoals || "",
    candidate.hobbies.join(" "),
    // 위치/기타
    candidate.livingLocation || "",
    candidate.hometown || "",
    candidate.education || "",
    candidate.ageRange || "",
    candidate.languages || "",
  ]
    .join(" ")
    .toLowerCase();

  // 유의어 확장된 키워드로 매칭
  const expandedKeywords = expandKeywords(keywords);

  let matchCount = 0;
  let bonusScore = 0;
  const matchedOriginal = new Set<string>(); // 원래 키워드 중 매칭된 것 추적

  for (const keyword of expandedKeywords) {
    const keywordLower = keyword.toLowerCase();
    if (searchableText.includes(keywordLower)) {
      // 원래 키워드 또는 그 유의어가 매칭됨
      const originalKeyword = keywords.find(k =>
        expandKeywords([k]).map(e => e.toLowerCase()).includes(keywordLower)
      );
      if (originalKeyword && !matchedOriginal.has(originalKeyword.toLowerCase())) {
        matchedOriginal.add(originalKeyword.toLowerCase());
        matchCount++;

        // 정확히 원래 키워드가 매칭된 경우 보너스 (유의어가 아닌)
        if (keywordLower === originalKeyword.toLowerCase()) {
          bonusScore += 0.2;
        }
      }
    }
  }

  // 원래 키워드 수 기준으로 정규화 + 보너스
  const baseScore = matchCount / keywords.length;
  return Math.min(baseScore + bonusScore, 1.0);
}

/**
 * 총합 점수 계산 (동적 가중치 적용)
 */
function calculateTotalScore(
  scores: SemanticScores,
  weights: typeof DEFAULT_WEIGHTS
): number {
  return (
    scores.semanticScore * weights.vectorSimilarity +
    scores.profileFieldScore * weights.profileFieldMatch +
    scores.mbtiMatchScore * weights.mbtiMatch +
    scores.tagMatchScore * weights.tagMatch +
    scores.textMatchScore * weights.textMatch
  );
}

/**
 * 매칭 이유 생성 (의도 기반)
 */
function generateMatchReasons(
  candidate: SemanticSearchCandidate,
  expandedQuery: ExpandedQuery,
  scores: SemanticScores,
  queryIntent: QueryIntent
): string[] {
  const reasons: string[] = [];

  // 의도별 주요 매칭 이유 우선 표시
  switch (queryIntent) {
    case 'skill':
      // 기술/역량 검색일 때 텍스트 매칭 우선
      if (scores.textMatchScore >= 0.5) {
        const matchedFields: string[] = [];
        if (candidate.techStack && expandedQuery.searchKeywords.some(k =>
          candidate.techStack!.toLowerCase().includes(k.toLowerCase())
        )) {
          matchedFields.push("기술 스택");
        }
        if (candidate.workDescription && expandedQuery.searchKeywords.some(k =>
          candidate.workDescription!.toLowerCase().includes(k.toLowerCase())
        )) {
          matchedFields.push("업무 설명");
        }
        if (matchedFields.length > 0) {
          reasons.push(`${matchedFields.join(", ")} 일치`);
        }
      }
      break;

    case 'hobby':
      // 취미 검색일 때 태그 매칭 우선
      if (scores.tagMatchScore > 0 && expandedQuery.suggestedHobbyTags.length > 0) {
        const matchedTags = candidate.hobbies.filter((h) =>
          expandedQuery.suggestedHobbyTags
            .map((t) => t.toLowerCase())
            .includes(h.toLowerCase())
        );
        if (matchedTags.length > 0) {
          reasons.push(`취미: ${matchedTags.join(", ")}`);
        }
      }
      break;

    case 'mbti':
      // MBTI 검색일 때 MBTI 매칭 우선
      if (scores.mbtiMatchScore >= 0.7 && candidate.mbti) {
        reasons.push(`MBTI ${candidate.mbti} 일치`);
      } else if (scores.mbtiMatchScore >= 0.3 && candidate.mbti) {
        reasons.push(`MBTI ${candidate.mbti} 유사`);
      }
      break;

    case 'department':
      // 부서 검색일 때 부서/직무 매칭 우선
      if (expandedQuery.searchKeywords.some(k =>
        candidate.department.toLowerCase().includes(k.toLowerCase())
      )) {
        reasons.push(`부서: ${candidate.department}`);
      }
      if (expandedQuery.searchKeywords.some(k =>
        candidate.jobRole.toLowerCase().includes(k.toLowerCase())
      )) {
        reasons.push(`직무: ${candidate.jobRole}`);
      }
      break;
  }

  // 프로필 필드 직접 매칭 (personality 또는 일반)
  if (scores.profileFieldScore >= 0.5) {
    const matchedFields: string[] = [];
    if (candidate.collaborationStyle) {
      const hints = expandedQuery.profileFieldHints.collaborationStyle;
      if (hints.some((h) => candidate.collaborationStyle!.toLowerCase().includes(h.toLowerCase()))) {
        matchedFields.push("협업 스타일");
      }
    }
    if (candidate.strengths) {
      const hints = expandedQuery.profileFieldHints.strengths;
      if (hints.some((h) => candidate.strengths!.toLowerCase().includes(h.toLowerCase()))) {
        matchedFields.push("강점");
      }
    }
    if (candidate.preferredPeopleType) {
      const hints = expandedQuery.profileFieldHints.preferredPeopleType;
      if (hints.some((h) => candidate.preferredPeopleType!.toLowerCase().includes(h.toLowerCase()))) {
        matchedFields.push("선호하는 동료 유형");
      }
    }
    if (matchedFields.length > 0 && !reasons.some(r => r.includes("필드"))) {
      reasons.push(`${matchedFields.join(", ")} 일치`);
    }
  } else if (scores.profileFieldScore > 0 && reasons.length === 0) {
    reasons.push("프로필과 부분 일치");
  }

  // 벡터 유사도 기반 (보조 지표)
  if (scores.semanticScore >= 0.65 && reasons.length === 0) {
    reasons.push("프로필 유사도 높음");
  }

  // 기본 이유
  if (reasons.length === 0) {
    reasons.push("검색어와 관련된 프로필");
  }

  return reasons;
}

/**
 * 검색 결과를 그래프 노드 형식으로 변환
 */
export function resultsToGraphNodes(
  results: SemanticSearchResult[],
  currentUserId: string
): {
  nodes: Array<{
    id: string;
    userId: string;
    name: string;
    department: string;
    jobRole: string;
    officeLocation: string;
    mbti?: string;
    avatarUrl?: string;
    hobbies: string[];
    isCurrentUser: boolean;
    clusterId: string;
    position: { x: number; y: number };
    matchScore?: number;
    matchReasons?: string[];
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    similarity: number;
    commonTags: string[];
    connectionType: string;
    strengthLevel: string;
    mbtiCompatible: boolean;
  }>;
} {
  const nodes = results.map((result, index) => {
    // 원형 배치 (중앙에서 바깥으로)
    const angle = (2 * Math.PI * index) / results.length;
    const radius = 200 + (index % 3) * 50;

    return {
      id: result.userId,
      userId: result.userId,
      name: result.name,
      department: result.department,
      jobRole: result.jobRole,
      officeLocation: result.officeLocation,
      mbti: result.mbti,
      avatarUrl: result.avatarUrl,
      hobbies: result.hobbies,
      isCurrentUser: result.userId === currentUserId,
      clusterId: `semantic-${result.department}`,
      position: {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      },
      matchScore: result.totalScore,
      matchReasons: result.matchReasons,
    };
  });

  // 현재 사용자와 검색 결과 간의 엣지 생성
  const edges = results.map((result) => ({
    id: `edge-${currentUserId}-${result.userId}`,
    source: currentUserId,
    target: result.userId,
    similarity: result.totalScore,
    commonTags: result.hobbies.slice(0, 3),
    connectionType: "semantic_match",
    strengthLevel:
      result.totalScore >= 0.6
        ? "strong"
        : result.totalScore >= 0.4
        ? "moderate"
        : "weak",
    mbtiCompatible: result.mbtiMatchScore >= 0.7,
  }));

  return { nodes, edges };
}

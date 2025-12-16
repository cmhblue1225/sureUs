/**
 * 의미 검색을 위한 하이브리드 매칭 모듈
 * 벡터 유사도 + MBTI + 태그 매칭을 결합
 */

import { cosineSimilarity } from "@/lib/openai/embeddings";
import type { ExpandedQuery } from "@/lib/anthropic/queryExpansion";

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
}

// 점수 가중치 - 프로필 필드(텍스트) 매칭 중심으로 조정
const SEMANTIC_WEIGHTS = {
  vectorSimilarity: 0.35,  // 벡터 유사도 (감소)
  profileFieldMatch: 0.40, // 프로필 필드 직접 매칭 (신규, 가장 높음)
  mbtiMatch: 0.10,         // MBTI (감소 - 직접 언급된 경우만)
  tagMatch: 0.10,          // 태그 (감소 - 직접 언급된 경우만)
  textMatch: 0.05,         // 키워드 (감소)
};

/**
 * 하이브리드 의미 검색 수행
 */
export function performSemanticSearch(
  candidates: SemanticSearchCandidate[],
  options: SemanticSearchOptions
): SemanticSearchResult[] {
  const { expandedQuery, queryEmbedding, limit = 20, minScore = 0.1 } = options;

  const results: SemanticSearchResult[] = [];

  for (const candidate of candidates) {
    const scores = calculateSemanticScores(candidate, expandedQuery, queryEmbedding);
    const totalScore = calculateTotalScore(scores);

    if (totalScore >= minScore) {
      const matchReasons = generateMatchReasons(candidate, expandedQuery, scores);

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
    expandedQuery.profileFieldHints
  );

  // 3. MBTI 매칭 (직접 언급된 경우에만 의미 있음)
  const mbtiMatchScore = calculateMbtiMatchScore(
    candidate.mbti,
    expandedQuery.suggestedMbtiTypes
  );

  // 4. 태그 매칭 (취미 태그 - 직접 언급된 경우에만)
  const tagMatchScore = calculateTagMatchScore(
    candidate.hobbies,
    expandedQuery.suggestedHobbyTags
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
 * 협업 스타일, 강점, 선호하는 동료 유형 필드와 직접 비교
 */
function calculateProfileFieldScore(
  candidate: SemanticSearchCandidate,
  hints: ExpandedQuery["profileFieldHints"]
): number {
  let totalScore = 0;
  let fieldCount = 0;

  // 협업 스타일 매칭
  if (candidate.collaborationStyle && hints.collaborationStyle.length > 0) {
    const styleText = candidate.collaborationStyle.toLowerCase();
    const matchCount = hints.collaborationStyle.filter((h) =>
      styleText.includes(h.toLowerCase())
    ).length;
    if (matchCount > 0) {
      totalScore += matchCount / hints.collaborationStyle.length;
      fieldCount++;
    }
  }

  // 강점 매칭
  if (candidate.strengths && hints.strengths.length > 0) {
    const strengthsText = candidate.strengths.toLowerCase();
    const matchCount = hints.strengths.filter((h) =>
      strengthsText.includes(h.toLowerCase())
    ).length;
    if (matchCount > 0) {
      totalScore += matchCount / hints.strengths.length;
      fieldCount++;
    }
  }

  // 선호하는 동료 유형 매칭
  if (candidate.preferredPeopleType && hints.preferredPeopleType.length > 0) {
    const preferredText = candidate.preferredPeopleType.toLowerCase();
    const matchCount = hints.preferredPeopleType.filter((h) =>
      preferredText.includes(h.toLowerCase())
    ).length;
    if (matchCount > 0) {
      totalScore += matchCount / hints.preferredPeopleType.length;
      fieldCount++;
    }
  }

  // 필드가 매칭된 경우에만 점수 계산
  if (fieldCount === 0) {
    return 0;
  }

  return totalScore / fieldCount;
}

/**
 * MBTI 매칭 점수
 */
function calculateMbtiMatchScore(
  candidateMbti: string | undefined,
  suggestedTypes: string[]
): number {
  if (!candidateMbti || suggestedTypes.length === 0) {
    return 0;
  }

  const upperMbti = candidateMbti.toUpperCase();

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
 * 태그 매칭 점수 (Jaccard 유사도)
 */
function calculateTagMatchScore(
  candidateTags: string[],
  suggestedTags: string[]
): number {
  if (candidateTags.length === 0 || suggestedTags.length === 0) {
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
 * 텍스트 매칭 점수 (키워드 기반)
 */
function calculateTextMatchScore(
  candidate: SemanticSearchCandidate,
  keywords: string[]
): number {
  if (keywords.length === 0) {
    return 0;
  }

  // 검색 대상 텍스트 결합 (새 필드 포함)
  const searchableText = [
    candidate.collaborationStyle || "",
    candidate.strengths || "",
    candidate.preferredPeopleType || "",
    candidate.department,
    candidate.jobRole,
    // 새 필드 추가
    candidate.livingLocation || "",
    candidate.hometown || "",
    candidate.education || "",
    candidate.workDescription || "",
    candidate.techStack || "",
    candidate.favoriteFood || "",
    candidate.interests || "",
    candidate.careerGoals || "",
    candidate.certifications || "",
    candidate.languages || "",
  ]
    .join(" ")
    .toLowerCase();

  let matchCount = 0;
  for (const keyword of keywords) {
    if (searchableText.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }

  return matchCount / keywords.length;
}

/**
 * 총합 점수 계산
 */
function calculateTotalScore(scores: SemanticScores): number {
  return (
    scores.semanticScore * SEMANTIC_WEIGHTS.vectorSimilarity +
    scores.profileFieldScore * SEMANTIC_WEIGHTS.profileFieldMatch +
    scores.mbtiMatchScore * SEMANTIC_WEIGHTS.mbtiMatch +
    scores.tagMatchScore * SEMANTIC_WEIGHTS.tagMatch +
    scores.textMatchScore * SEMANTIC_WEIGHTS.textMatch
  );
}

/**
 * 매칭 이유 생성
 */
function generateMatchReasons(
  candidate: SemanticSearchCandidate,
  expandedQuery: ExpandedQuery,
  scores: SemanticScores
): string[] {
  const reasons: string[] = [];

  // 프로필 필드 직접 매칭 (가장 신뢰도 높음)
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
    if (matchedFields.length > 0) {
      reasons.push(`${matchedFields.join(", ")} 필드에서 일치`);
    }
  } else if (scores.profileFieldScore > 0) {
    reasons.push("프로필 자기소개와 부분 일치");
  }

  // 벡터 유사도 기반 (보조 지표)
  if (scores.semanticScore >= 0.65) {
    reasons.push("전체 프로필 내용 유사도 높음");
  }

  // MBTI 매칭 (직접 언급된 경우에만)
  if (scores.mbtiMatchScore >= 0.7 && candidate.mbti && expandedQuery.suggestedMbtiTypes.length > 0) {
    reasons.push(`MBTI ${candidate.mbti} 일치`);
  }

  // 태그 매칭 (직접 언급된 경우에만)
  if (scores.tagMatchScore > 0 && expandedQuery.suggestedHobbyTags.length > 0) {
    const matchedTags = candidate.hobbies.filter((h) =>
      expandedQuery.suggestedHobbyTags
        .map((t) => t.toLowerCase())
        .includes(h.toLowerCase())
    );
    if (matchedTags.length > 0) {
      reasons.push(`취미 태그: ${matchedTags.join(", ")}`);
    }
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

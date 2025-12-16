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

// 점수 가중치
const SEMANTIC_WEIGHTS = {
  vectorSimilarity: 0.50,
  mbtiMatch: 0.25,
  tagMatch: 0.15,
  textMatch: 0.10,
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

  // 2. MBTI 매칭
  const mbtiMatchScore = calculateMbtiMatchScore(
    candidate.mbti,
    expandedQuery.suggestedMbtiTypes
  );

  // 3. 태그 매칭 (취미 태그)
  const tagMatchScore = calculateTagMatchScore(
    candidate.hobbies,
    expandedQuery.suggestedHobbyTags
  );

  // 4. 텍스트 매칭 (키워드 기반)
  const textMatchScore = calculateTextMatchScore(
    candidate,
    expandedQuery.searchKeywords
  );

  return {
    semanticScore,
    mbtiMatchScore,
    tagMatchScore,
    textMatchScore,
  };
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

  // 검색 대상 텍스트 결합
  const searchableText = [
    candidate.collaborationStyle || "",
    candidate.strengths || "",
    candidate.preferredPeopleType || "",
    candidate.department,
    candidate.jobRole,
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

  // 벡터 유사도 기반
  if (scores.semanticScore >= 0.6) {
    reasons.push("프로필 내용이 검색 조건과 높은 유사도를 보입니다");
  } else if (scores.semanticScore >= 0.4) {
    reasons.push("프로필 내용이 검색 조건과 유사합니다");
  }

  // MBTI 매칭
  if (scores.mbtiMatchScore >= 0.7 && candidate.mbti) {
    const suggestedStr = expandedQuery.suggestedMbtiTypes.join(", ");
    reasons.push(`MBTI ${candidate.mbti}가 추천 유형(${suggestedStr})과 일치합니다`);
  } else if (scores.mbtiMatchScore >= 0.3 && candidate.mbti) {
    reasons.push(`MBTI ${candidate.mbti}가 검색 조건과 유사한 성향입니다`);
  }

  // 태그 매칭
  if (scores.tagMatchScore > 0) {
    const matchedTags = candidate.hobbies.filter((h) =>
      expandedQuery.suggestedHobbyTags
        .map((t) => t.toLowerCase())
        .includes(h.toLowerCase())
    );
    if (matchedTags.length > 0) {
      reasons.push(`공통 관심사: ${matchedTags.join(", ")}`);
    }
  }

  // 텍스트 매칭
  if (scores.textMatchScore >= 0.5) {
    reasons.push("프로필 텍스트에 관련 키워드가 포함되어 있습니다");
  }

  // 기본 이유
  if (reasons.length === 0) {
    reasons.push("검색 조건과 부분적으로 일치합니다");
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

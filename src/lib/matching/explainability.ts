import { cosineSimilarity } from "@/lib/openai/embeddings";
import type { MatchCandidate, MatchScores } from "./algorithm";
import { getCommonTags } from "./algorithm";

export interface ExplanationDetail {
  factor: "collaboration_style" | "hobbies" | "strengths" | "preferred_type";
  score: number;
  reason: string;
}

export interface MatchExplanation {
  summary: string;
  details: ExplanationDetail[];
  commonTags: string[];
  suggestedTopics: string[];
}

/**
 * Generate human-readable explanation for a match
 * All text in Korean
 */
export function generateMatchExplanation(
  user: MatchCandidate,
  candidate: MatchCandidate,
  scores: MatchScores
): MatchExplanation {
  const details: ExplanationDetail[] = [];
  const commonTags = getCommonTags(user.hobbies, candidate.hobbies);

  // Calculate individual field similarities for explanation
  if (user.collaborationStyleEmbedding && candidate.collaborationStyleEmbedding) {
    const similarity = cosineSimilarity(
      user.collaborationStyleEmbedding,
      candidate.collaborationStyleEmbedding
    );
    const normalizedScore = (similarity + 1) / 2;

    if (normalizedScore > 0.6) {
      details.push({
        factor: "collaboration_style",
        score: normalizedScore,
        reason: getCollaborationStyleReason(normalizedScore),
      });
    }
  }

  if (user.strengthsEmbedding && candidate.strengthsEmbedding) {
    const similarity = cosineSimilarity(
      user.strengthsEmbedding,
      candidate.strengthsEmbedding
    );
    const normalizedScore = (similarity + 1) / 2;

    if (normalizedScore > 0.5) {
      details.push({
        factor: "strengths",
        score: normalizedScore,
        reason: getStrengthsReason(normalizedScore),
      });
    }
  }

  // Hobbies explanation
  if (commonTags.length > 0) {
    details.push({
      factor: "hobbies",
      score: scores.tagOverlapScore,
      reason: getHobbiesReason(commonTags),
    });
  }

  // Generate summary
  const summary = generateSummary(details, commonTags, scores);

  // Generate suggested topics
  const suggestedTopics = generateSuggestedTopics(commonTags, details);

  return {
    summary,
    details,
    commonTags,
    suggestedTopics,
  };
}

function getCollaborationStyleReason(score: number): string {
  if (score > 0.8) {
    return "협업 방식이 매우 비슷합니다";
  } else if (score > 0.7) {
    return "비슷한 협업 스타일을 가지고 있습니다";
  } else {
    return "일부 협업 방식에서 유사점이 있습니다";
  }
}

function getStrengthsReason(score: number): string {
  if (score > 0.8) {
    return "비슷한 강점과 역량을 보유하고 있습니다";
  } else if (score > 0.6) {
    return "일부 강점 영역에서 공통점이 있습니다";
  } else {
    return "상호 보완적인 강점을 가지고 있습니다";
  }
}

function getHobbiesReason(commonTags: string[]): string {
  if (commonTags.length >= 5) {
    return `${commonTags.slice(0, 3).join(", ")} 등 많은 관심사가 겹칩니다`;
  } else if (commonTags.length >= 3) {
    return `${commonTags.join(", ")}에 함께 관심이 있습니다`;
  } else if (commonTags.length > 0) {
    return `${commonTags.join(", ")}에 대한 관심사가 같습니다`;
  }
  return "";
}

function generateSummary(
  details: ExplanationDetail[],
  commonTags: string[],
  scores: MatchScores
): string {
  const parts: string[] = [];

  // High embedding similarity
  if (scores.embeddingSimilarity > 0.7) {
    parts.push("업무 스타일이 비슷합니다");
  }

  // Common hobbies
  if (commonTags.length > 0) {
    if (commonTags.length >= 3) {
      parts.push("여러 관심사를 공유합니다");
    } else {
      parts.push("공통 관심사가 있습니다");
    }
  }

  // Preference match
  if (scores.preferenceMatchScore > 0.7) {
    parts.push("선호하는 조건에 잘 맞습니다");
  }

  if (parts.length === 0) {
    return "함께 일하기 좋은 동료일 수 있습니다";
  }

  return parts.join(", ");
}

function generateSuggestedTopics(
  commonTags: string[],
  details: ExplanationDetail[]
): string[] {
  const topics: string[] = [];

  // Add topics based on common hobbies
  for (const tag of commonTags.slice(0, 3)) {
    topics.push(getSuggestedTopicForTag(tag));
  }

  // Add topics based on collaboration style
  const collaborationDetail = details.find((d) => d.factor === "collaboration_style");
  if (collaborationDetail && collaborationDetail.score > 0.7) {
    topics.push("선호하는 협업 방식에 대해 이야기해보세요");
  }

  // Add general topics if we have few suggestions
  if (topics.length < 2) {
    topics.push("현재 진행 중인 프로젝트에 대해 이야기해보세요");
    topics.push("최근 읽은 책이나 배운 것에 대해 공유해보세요");
  }

  return topics.slice(0, 3);
}

function getSuggestedTopicForTag(tag: string): string {
  const topicMap: Record<string, string> = {
    "러닝": "좋아하는 러닝 코스나 대회 경험에 대해 이야기해보세요",
    "헬스": "운동 루틴이나 목표에 대해 이야기해보세요",
    "독서": "최근 읽은 책을 추천해보세요",
    "영화": "최근 본 영화에 대해 이야기해보세요",
    "게임": "좋아하는 게임에 대해 이야기해보세요",
    "요리": "좋아하는 요리나 맛집에 대해 이야기해보세요",
    "여행": "가고 싶은 여행지에 대해 이야기해보세요",
    "사이드프로젝트": "진행 중인 사이드프로젝트에 대해 이야기해보세요",
    "커피챗": "커피챗 일정을 잡아보세요",
    "네트워킹": "관심 있는 커뮤니티나 모임에 대해 이야기해보세요",
  };

  return topicMap[tag] || `${tag}에 대해 이야기해보세요`;
}

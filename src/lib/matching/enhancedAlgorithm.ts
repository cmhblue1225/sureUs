/**
 * Enhanced Matching Algorithm
 * Combines 7 scoring components for comprehensive matching
 *
 * Components:
 * - Embedding Similarity (30%)
 * - Tag Overlap (25%)
 * - MBTI Compatibility (12%)
 * - Job Role Score (10%)
 * - Department Score (8%)
 * - Location Score (5%)
 * - Preference Match (10%)
 */

import { cosineSimilarity } from "@/lib/openai/embeddings";
import { getMbtiCompatibility, getMbtiCompatibilityDescription } from "./mbtiCompatibility";
import { calculateJobRoleScore, getJobRoleRelationship } from "./jobRoleScoring";
import { calculateDepartmentScore, getDepartmentSynergyDescription } from "./departmentScoring";
import { calculateLocationScore, getLocationProximityDescription } from "./locationScoring";
import { calculateTagOverlap, getCommonTags } from "./algorithm";

// Enhanced candidate with all profile data
export interface EnhancedMatchCandidate {
  userId: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];
  embedding?: number[];
  collaborationStyleEmbedding?: number[];
  strengthsEmbedding?: number[];
  preferredPeopleTypeEmbedding?: number[];
}

// Enhanced weights with new components
export interface EnhancedMatchWeights {
  embeddingWeight: number;
  tagWeight: number;
  mbtiWeight: number;
  jobRoleWeight: number;
  departmentWeight: number;
  locationWeight: number;
  preferenceWeight: number;
}

// Enhanced scores with breakdown
export interface EnhancedMatchScores {
  totalScore: number;
  embeddingSimilarity: number;
  tagOverlapScore: number;
  mbtiCompatibilityScore: number;
  jobRoleScore: number;
  departmentScore: number;
  locationScore: number;
  preferenceMatchScore: number;
}

// User preferences for matching
export interface EnhancedUserPreferences {
  preferredDepartments?: string[];
  preferredJobRoles?: string[];
  preferredLocations?: string[];
  preferredMbtiTypes?: string[];
  preferCrossDepartment?: boolean;
}

// Default weights (must sum to 1.0)
export const DEFAULT_ENHANCED_WEIGHTS: EnhancedMatchWeights = {
  embeddingWeight: 0.30,
  tagWeight: 0.25,
  mbtiWeight: 0.12,
  jobRoleWeight: 0.10,
  departmentWeight: 0.08,
  locationWeight: 0.05,
  preferenceWeight: 0.10,
};

/**
 * Calculate embedding similarity between two users
 */
function calculateEmbeddingSimilarity(
  userEmbedding: number[] | undefined,
  candidateEmbedding: number[] | undefined
): number {
  if (!userEmbedding || !candidateEmbedding) {
    return 0;
  }

  try {
    const similarity = cosineSimilarity(userEmbedding, candidateEmbedding);
    // Normalize from [-1, 1] to [0, 1]
    return (similarity + 1) / 2;
  } catch {
    return 0;
  }
}

/**
 * Calculate preference match score
 */
function calculatePreferenceMatch(
  preferences: EnhancedUserPreferences | null,
  candidate: EnhancedMatchCandidate
): number {
  if (!preferences) {
    return 0.5; // Neutral if no preferences
  }

  let matchCount = 0;
  let totalCriteria = 0;

  // Department preference
  if (preferences.preferredDepartments && preferences.preferredDepartments.length > 0) {
    totalCriteria++;
    if (preferences.preferredDepartments.includes(candidate.department)) {
      matchCount++;
    }
  }

  // Job role preference
  if (preferences.preferredJobRoles && preferences.preferredJobRoles.length > 0) {
    totalCriteria++;
    if (preferences.preferredJobRoles.includes(candidate.jobRole)) {
      matchCount++;
    }
  }

  // Location preference
  if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
    totalCriteria++;
    if (preferences.preferredLocations.includes(candidate.officeLocation)) {
      matchCount++;
    }
  }

  // MBTI preference
  if (preferences.preferredMbtiTypes && preferences.preferredMbtiTypes.length > 0 && candidate.mbti) {
    totalCriteria++;
    if (preferences.preferredMbtiTypes.includes(candidate.mbti)) {
      matchCount++;
    }
  }

  if (totalCriteria === 0) {
    return 0.5; // Neutral if no preferences set
  }

  return matchCount / totalCriteria;
}

/**
 * Calculate comprehensive match score using all 7 components
 */
export function calculateEnhancedMatchScore(
  user: EnhancedMatchCandidate,
  candidate: EnhancedMatchCandidate,
  userPreferences: EnhancedUserPreferences | null = null,
  weights: EnhancedMatchWeights = DEFAULT_ENHANCED_WEIGHTS
): EnhancedMatchScores {
  // 1. Embedding similarity
  const embeddingSimilarity = calculateEmbeddingSimilarity(
    user.embedding,
    candidate.embedding
  );

  // 2. Tag overlap (Jaccard similarity)
  const tagOverlapScore = calculateTagOverlap(user.hobbies, candidate.hobbies);

  // 3. MBTI compatibility
  const mbtiCompatibilityScore = getMbtiCompatibility(user.mbti, candidate.mbti);

  // 4. Job role score
  const jobRoleScore = calculateJobRoleScore(user.jobRole, candidate.jobRole);

  // 5. Department score
  const departmentScore = calculateDepartmentScore(
    user.department,
    candidate.department,
    userPreferences?.preferCrossDepartment ?? true
  );

  // 6. Location score
  const locationScore = calculateLocationScore(
    user.officeLocation,
    candidate.officeLocation
  );

  // 7. Preference match
  const preferenceMatchScore = calculatePreferenceMatch(userPreferences, candidate);

  // Calculate weighted total
  const totalScore =
    weights.embeddingWeight * embeddingSimilarity +
    weights.tagWeight * tagOverlapScore +
    weights.mbtiWeight * mbtiCompatibilityScore +
    weights.jobRoleWeight * jobRoleScore +
    weights.departmentWeight * departmentScore +
    weights.locationWeight * locationScore +
    weights.preferenceWeight * preferenceMatchScore;

  return {
    totalScore,
    embeddingSimilarity,
    tagOverlapScore,
    mbtiCompatibilityScore,
    jobRoleScore,
    departmentScore,
    locationScore,
    preferenceMatchScore,
  };
}

/**
 * Generate detailed explanation for the match
 */
export function generateEnhancedExplanation(
  user: EnhancedMatchCandidate,
  candidate: EnhancedMatchCandidate,
  scores: EnhancedMatchScores
): {
  summary: string;
  highlights: string[];
  details: { label: string; value: string; score: number }[];
} {
  const highlights: string[] = [];
  const details: { label: string; value: string; score: number }[] = [];

  // Common tags
  const commonTags = getCommonTags(user.hobbies, candidate.hobbies);
  if (commonTags.length > 0) {
    highlights.push(`공통 관심사: ${commonTags.join(", ")}`);
  }

  // MBTI compatibility
  if (user.mbti && candidate.mbti) {
    const mbtiDesc = getMbtiCompatibilityDescription(user.mbti, candidate.mbti);
    if (scores.mbtiCompatibilityScore >= 0.75) {
      highlights.push(`MBTI ${mbtiDesc} (${user.mbti}-${candidate.mbti})`);
    }
    details.push({
      label: "MBTI 궁합",
      value: mbtiDesc,
      score: scores.mbtiCompatibilityScore,
    });
  }

  // Job role
  const jobRoleDesc = getJobRoleRelationship(user.jobRole, candidate.jobRole);
  if (scores.jobRoleScore >= 0.8) {
    highlights.push(`${jobRoleDesc}`);
  }
  details.push({
    label: "직군",
    value: jobRoleDesc,
    score: scores.jobRoleScore,
  });

  // Department
  const deptDesc = getDepartmentSynergyDescription(user.department, candidate.department);
  if (scores.departmentScore >= 0.8) {
    highlights.push(`${deptDesc}`);
  }
  details.push({
    label: "부서",
    value: deptDesc,
    score: scores.departmentScore,
  });

  // Location
  const locDesc = getLocationProximityDescription(user.officeLocation, candidate.officeLocation);
  details.push({
    label: "위치",
    value: locDesc,
    score: scores.locationScore,
  });

  // Text similarity
  if (scores.embeddingSimilarity >= 0.6) {
    highlights.push("협업 스타일이 잘 맞음");
  }
  details.push({
    label: "협업 스타일",
    value: scores.embeddingSimilarity >= 0.7 ? "매우 유사" :
           scores.embeddingSimilarity >= 0.5 ? "유사" : "보통",
    score: scores.embeddingSimilarity,
  });

  // Tag overlap
  details.push({
    label: "관심사 중첩",
    value: commonTags.length > 0 ? `${commonTags.length}개 공통` : "공통 관심사 없음",
    score: scores.tagOverlapScore,
  });

  // Generate summary based on total score
  let summary: string;
  if (scores.totalScore >= 0.75) {
    summary = "매우 잘 맞는 동료입니다";
  } else if (scores.totalScore >= 0.6) {
    summary = "좋은 네트워킹 기회입니다";
  } else if (scores.totalScore >= 0.45) {
    summary = "새로운 관점을 얻을 수 있습니다";
  } else {
    summary = "다양성을 넓힐 수 있습니다";
  }

  return {
    summary,
    highlights: highlights.slice(0, 3), // Top 3 highlights
    details,
  };
}

/**
 * Get conversation starters based on match
 */
export function getConversationStarters(
  user: EnhancedMatchCandidate,
  candidate: EnhancedMatchCandidate
): string[] {
  const starters: string[] = [];
  const commonTags = getCommonTags(user.hobbies, candidate.hobbies);

  // Hobby-based starters
  const hobbyStarters: Record<string, string> = {
    "러닝": "어디서 주로 러닝하시나요?",
    "등산": "최근에 다녀온 산이 있으신가요?",
    "독서": "요즘 읽고 계신 책이 있으신가요?",
    "게임": "요즘 어떤 게임 하시나요?",
    "사이드프로젝트": "사이드 프로젝트 진행 중이신 게 있으신가요?",
    "커피챗": "커피 한 잔 하면서 이야기 나눠보실래요?",
    "여행": "최근 다녀온 여행지가 있으신가요?",
    "음악": "요즘 자주 듣는 음악이 있으신가요?",
    "요리": "최근에 만들어본 요리가 있으신가요?",
    "영화": "최근에 본 좋은 영화가 있으신가요?",
  };

  for (const tag of commonTags) {
    if (hobbyStarters[tag]) {
      starters.push(hobbyStarters[tag]);
    }
  }

  // Role-based starters
  if (calculateJobRoleScore(user.jobRole, candidate.jobRole) >= 0.8) {
    starters.push(`${candidate.jobRole}로서 요즘 관심 있는 기술이나 트렌드가 있으신가요?`);
  }

  // MBTI-based starters
  if (user.mbti && candidate.mbti && getMbtiCompatibility(user.mbti, candidate.mbti) >= 0.8) {
    starters.push(`${candidate.mbti} 유형으로서 팀에서 일할 때 선호하시는 방식이 있으신가요?`);
  }

  // Default starters if none found
  if (starters.length === 0) {
    starters.push("요즘 회사에서 어떤 일을 주로 하고 계신가요?");
    starters.push("회사 생활하시면서 가장 재미있었던 프로젝트가 있으신가요?");
  }

  return starters.slice(0, 3);
}

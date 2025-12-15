import { cosineSimilarity } from "@/lib/openai/embeddings";

export interface MatchCandidate {
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

export interface MatchScores {
  totalScore: number;
  embeddingSimilarity: number;
  tagOverlapScore: number;
  preferenceMatchScore: number;
}

export interface MatchWeights {
  embeddingWeight: number;
  tagWeight: number;
  preferenceWeight: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  embeddingWeight: 0.45,
  tagWeight: 0.35,
  preferenceWeight: 0.20,
};

/**
 * Calculate embedding similarity between two users
 * Using combined embedding for overall similarity
 */
export function calculateEmbeddingSimilarity(
  userEmbedding: number[] | undefined,
  candidateEmbedding: number[] | undefined
): number {
  if (!userEmbedding || !candidateEmbedding) {
    return 0;
  }

  try {
    return cosineSimilarity(userEmbedding, candidateEmbedding);
  } catch {
    return 0;
  }
}

/**
 * Calculate tag overlap score using Jaccard similarity
 */
export function calculateTagOverlap(
  userTags: string[],
  candidateTags: string[]
): number {
  if (userTags.length === 0 && candidateTags.length === 0) {
    return 0;
  }

  const userSet = new Set(userTags);
  const candidateSet = new Set(candidateTags);

  let intersection = 0;
  for (const tag of userSet) {
    if (candidateSet.has(tag)) {
      intersection++;
    }
  }

  const union = new Set([...userTags, ...candidateTags]).size;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

/**
 * Calculate preference match score
 * This considers the user's preferred types vs candidate's attributes
 */
export function calculatePreferenceMatch(
  userPreferences: {
    preferredDepartments?: string[];
    preferredJobRoles?: string[];
    preferredLocations?: string[];
    preferredMbtiTypes?: string[];
  } | null,
  candidate: MatchCandidate
): number {
  if (!userPreferences) {
    return 0.5; // Neutral score if no preferences set
  }

  let matchCount = 0;
  let totalCriteria = 0;

  // Check department preference
  if (userPreferences.preferredDepartments && userPreferences.preferredDepartments.length > 0) {
    totalCriteria++;
    if (userPreferences.preferredDepartments.includes(candidate.department)) {
      matchCount++;
    }
  }

  // Check job role preference
  if (userPreferences.preferredJobRoles && userPreferences.preferredJobRoles.length > 0) {
    totalCriteria++;
    if (userPreferences.preferredJobRoles.includes(candidate.jobRole)) {
      matchCount++;
    }
  }

  // Check location preference
  if (userPreferences.preferredLocations && userPreferences.preferredLocations.length > 0) {
    totalCriteria++;
    if (userPreferences.preferredLocations.includes(candidate.officeLocation)) {
      matchCount++;
    }
  }

  // Check MBTI preference
  if (userPreferences.preferredMbtiTypes && userPreferences.preferredMbtiTypes.length > 0 && candidate.mbti) {
    totalCriteria++;
    if (userPreferences.preferredMbtiTypes.includes(candidate.mbti)) {
      matchCount++;
    }
  }

  if (totalCriteria === 0) {
    return 0.5; // Neutral score if no preferences set
  }

  return matchCount / totalCriteria;
}

/**
 * Calculate total match score
 */
export function calculateMatchScore(
  user: MatchCandidate,
  candidate: MatchCandidate,
  userPreferences: {
    preferredDepartments?: string[];
    preferredJobRoles?: string[];
    preferredLocations?: string[];
    preferredMbtiTypes?: string[];
  } | null,
  weights: MatchWeights = DEFAULT_WEIGHTS
): MatchScores {
  const embeddingSimilarity = calculateEmbeddingSimilarity(
    user.embedding,
    candidate.embedding
  );

  const tagOverlapScore = calculateTagOverlap(user.hobbies, candidate.hobbies);

  const preferenceMatchScore = calculatePreferenceMatch(userPreferences, candidate);

  // Normalize embedding similarity from [-1, 1] to [0, 1]
  const normalizedEmbeddingSimilarity = (embeddingSimilarity + 1) / 2;

  const totalScore =
    weights.embeddingWeight * normalizedEmbeddingSimilarity +
    weights.tagWeight * tagOverlapScore +
    weights.preferenceWeight * preferenceMatchScore;

  return {
    totalScore,
    embeddingSimilarity: normalizedEmbeddingSimilarity,
    tagOverlapScore,
    preferenceMatchScore,
  };
}

/**
 * Get common tags between two users
 */
export function getCommonTags(userTags: string[], candidateTags: string[]): string[] {
  const userSet = new Set(userTags);
  return candidateTags.filter((tag) => userSet.has(tag));
}

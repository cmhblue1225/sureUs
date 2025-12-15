export interface MatchScoreBreakdown {
  textSimilarity: number;
  tagOverlap: number;
  mbtiCompatibility: number;
  jobRole: number;
  department: number;
  location: number;
  preferenceMatch: number;
}

export interface MatchExplanationDetail {
  label: string;
  value: string;
  score: number;
}

export interface MatchExplanation {
  summary: string;
  highlights: string[];
  details: MatchExplanationDetail[];
}

export interface MatchedUser {
  id: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];
}

export interface MatchRecommendation {
  user: MatchedUser;
  match: {
    totalScore: number;
    breakdown: MatchScoreBreakdown;
    explanation: MatchExplanation;
    conversationStarters: string[];
  };
}

export interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: MatchRecommendation[];
    meta: {
      generatedAt: string;
      nextRefreshAt: string;
      totalCandidates: number;
    };
  };
}

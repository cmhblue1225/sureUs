export interface MatchScoreBreakdown {
  textSimilarity: number;
  tagOverlap: number;
  preferenceMatch: number;
}

export interface MatchExplanationDetail {
  factor: "collaboration_style" | "hobbies" | "strengths" | "preferred_type";
  score: number;
  reason: string;
}

export interface MatchExplanation {
  summary: string;
  details: MatchExplanationDetail[];
  commonTags: string[];
  suggestedTopics: string[];
}

export interface MatchedUser {
  id: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  avatarUrl?: string;
  hobbies: string[];
}

export interface MatchRecommendation {
  user: MatchedUser;
  match: {
    totalScore: number;
    breakdown: MatchScoreBreakdown;
    explanation: MatchExplanation;
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

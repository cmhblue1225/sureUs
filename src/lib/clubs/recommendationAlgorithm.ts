/**
 * 동호회 추천 알고리즘
 *
 * 5가지 요소를 가중치로 계산:
 * 1. 태그 매칭 (35%) - 사용자 프로필 태그 vs 동호회 태그
 * 2. 소셜 그래프 (25%) - 추천된 동료들이 가입한 동호회
 * 3. 회원 구성 (20%) - 동호회 회원들과의 평균 유사도
 * 4. 활동도 (10%) - 최근 7일 게시물/채팅 활동
 * 5. 카테고리 선호도 (10%) - 사용자의 관심 카테고리 추론
 */

export interface ClubRecommendationWeights {
  tagMatch: number;
  socialGraph: number;
  memberComposition: number;
  activityLevel: number;
  categoryPreference: number;
}

export const DEFAULT_WEIGHTS: ClubRecommendationWeights = {
  tagMatch: 0.35,
  socialGraph: 0.25,
  memberComposition: 0.20,
  activityLevel: 0.10,
  categoryPreference: 0.10,
};

export interface UserProfile {
  id: string;
  hobby_tags: string[];
  mbti: string | null;
  department: string | null;
  job_role: string | null;
  location: string | null;
}

export interface Club {
  id: string;
  name: string;
  category: string;
  tags: string[];
  member_count: number;
  recent_activity_count: number; // Posts + chat messages in last 7 days
}

export interface ClubMember {
  user_id: string;
  club_id: string;
}

export interface RecommendedUser {
  user_id: string;
  score: number;
}

export interface ClubRecommendation {
  club: Club;
  score: number;
  reasons: string[];
  breakdown: {
    tagMatch: number;
    socialGraph: number;
    memberComposition: number;
    activityLevel: number;
    categoryPreference: number;
  };
}

/**
 * 태그 매칭 점수 계산
 * Jaccard 유사도 사용
 */
export function calculateTagMatchScore(
  userTags: string[],
  clubTags: string[]
): number {
  if (userTags.length === 0 || clubTags.length === 0) return 0;

  const userSet = new Set(userTags.map((t) => t.toLowerCase()));
  const clubSet = new Set(clubTags.map((t) => t.toLowerCase()));

  const intersection = new Set([...userSet].filter((x) => clubSet.has(x)));
  const union = new Set([...userSet, ...clubSet]);

  return intersection.size / union.size;
}

/**
 * 소셜 그래프 점수 계산
 * 추천 동료들이 가입한 동호회일수록 높은 점수
 */
export function calculateSocialGraphScore(
  recommendedUserIds: string[],
  clubMembers: ClubMember[],
  clubId: string
): { score: number; matchedCount: number } {
  if (recommendedUserIds.length === 0) return { score: 0, matchedCount: 0 };

  const recommendedSet = new Set(recommendedUserIds);
  const clubMemberIds = clubMembers
    .filter((m) => m.club_id === clubId)
    .map((m) => m.user_id);

  let matchedCount = 0;
  for (const memberId of clubMemberIds) {
    if (recommendedSet.has(memberId)) {
      matchedCount++;
    }
  }

  // 최대 점수는 추천 동료 중 5명 이상이 가입한 경우
  const score = Math.min(matchedCount / 5, 1);
  return { score, matchedCount };
}

/**
 * 회원 구성 유사도 점수 계산
 * 동호회 회원들과의 평균 프로필 유사도
 */
export function calculateMemberCompositionScore(
  userProfile: UserProfile,
  clubMemberProfiles: UserProfile[]
): number {
  if (clubMemberProfiles.length === 0) return 0;

  let totalScore = 0;

  for (const member of clubMemberProfiles) {
    let memberScore = 0;
    let factors = 0;

    // 태그 유사도
    if (userProfile.hobby_tags.length > 0 && member.hobby_tags.length > 0) {
      const tagScore = calculateTagMatchScore(
        userProfile.hobby_tags,
        member.hobby_tags
      );
      memberScore += tagScore;
      factors++;
    }

    // 부서 일치
    if (userProfile.department && member.department) {
      if (userProfile.department === member.department) {
        memberScore += 0.5; // 같은 부서
      }
      factors += 0.5;
    }

    // 직군 일치
    if (userProfile.job_role && member.job_role) {
      if (userProfile.job_role === member.job_role) {
        memberScore += 0.3; // 같은 직군
      }
      factors += 0.3;
    }

    // 지역 일치
    if (userProfile.location && member.location) {
      if (userProfile.location === member.location) {
        memberScore += 0.2; // 같은 지역
      }
      factors += 0.2;
    }

    if (factors > 0) {
      totalScore += memberScore / factors;
    }
  }

  return totalScore / clubMemberProfiles.length;
}

/**
 * 활동도 점수 계산
 * 최근 7일간 활동량 기준
 */
export function calculateActivityScore(recentActivityCount: number): number {
  // 0-10개: 낮음, 10-50개: 중간, 50개 이상: 높음
  if (recentActivityCount >= 50) return 1.0;
  if (recentActivityCount >= 30) return 0.8;
  if (recentActivityCount >= 10) return 0.6;
  if (recentActivityCount >= 5) return 0.4;
  if (recentActivityCount > 0) return 0.2;
  return 0;
}

/**
 * 카테고리 선호도 점수 계산
 * 사용자의 태그 기반으로 선호 카테고리 추론
 */
const CATEGORY_TAG_MAPPING: Record<string, string[]> = {
  "스포츠": ["운동", "헬스", "러닝", "축구", "농구", "테니스", "배드민턴", "등산", "수영", "골프", "자전거"],
  "게임": ["게임", "보드게임", "PC게임", "콘솔", "e스포츠", "롤", "배그"],
  "음악": ["음악", "밴드", "악기", "기타", "피아노", "드럼", "노래", "합창"],
  "미술": ["미술", "그림", "드로잉", "수채화", "일러스트", "디자인"],
  "독서": ["독서", "책", "문학", "시", "에세이", "소설"],
  "요리": ["요리", "베이킹", "음식", "맛집"],
  "여행": ["여행", "캠핑", "등산", "백패킹"],
  "봉사": ["봉사", "기부", "환경"],
  "자기계발": ["자기계발", "스터디", "영어", "외국어", "프로그래밍", "코딩"],
  "사진": ["사진", "카메라", "촬영"],
  "기타": [],
};

export function calculateCategoryPreferenceScore(
  userTags: string[],
  clubCategory: string
): number {
  if (userTags.length === 0) return 0.5; // 중립 점수

  const categoryTags = CATEGORY_TAG_MAPPING[clubCategory] || [];
  if (categoryTags.length === 0) return 0.5;

  const userTagsLower = userTags.map((t) => t.toLowerCase());
  const categoryTagsLower = categoryTags.map((t) => t.toLowerCase());

  let matchCount = 0;
  for (const userTag of userTagsLower) {
    for (const catTag of categoryTagsLower) {
      if (userTag.includes(catTag) || catTag.includes(userTag)) {
        matchCount++;
        break;
      }
    }
  }

  return Math.min(matchCount / 2, 1); // 2개 이상 매칭시 최대 점수
}

/**
 * 추천 이유 생성
 */
export function generateRecommendationReasons(
  breakdown: ClubRecommendation["breakdown"],
  socialMatchCount: number,
  club: Club
): string[] {
  const reasons: string[] = [];

  if (breakdown.tagMatch >= 0.5) {
    reasons.push("관심사 태그가 잘 맞아요");
  }

  if (socialMatchCount > 0) {
    reasons.push(`추천 동료 ${socialMatchCount}명이 활동 중이에요`);
  }

  if (breakdown.memberComposition >= 0.5) {
    reasons.push("비슷한 성향의 회원들이 많아요");
  }

  if (breakdown.activityLevel >= 0.6) {
    reasons.push("활발하게 활동하는 동호회예요");
  }

  if (breakdown.categoryPreference >= 0.5) {
    reasons.push(`${club.category} 분야에 관심이 있으시네요`);
  }

  // 기본 이유가 없으면 추가
  if (reasons.length === 0) {
    reasons.push("새로운 동호회를 탐색해보세요");
  }

  return reasons.slice(0, 3); // 최대 3개
}

/**
 * 종합 추천 점수 계산
 */
export function calculateClubRecommendation(
  userProfile: UserProfile,
  club: Club,
  clubMemberProfiles: UserProfile[],
  recommendedUserIds: string[],
  allClubMembers: ClubMember[],
  weights: ClubRecommendationWeights = DEFAULT_WEIGHTS
): ClubRecommendation {
  // 1. 태그 매칭
  const tagMatchScore = calculateTagMatchScore(
    userProfile.hobby_tags,
    club.tags
  );

  // 2. 소셜 그래프
  const { score: socialGraphScore, matchedCount: socialMatchCount } =
    calculateSocialGraphScore(recommendedUserIds, allClubMembers, club.id);

  // 3. 회원 구성
  const memberCompositionScore = calculateMemberCompositionScore(
    userProfile,
    clubMemberProfiles
  );

  // 4. 활동도
  const activityScore = calculateActivityScore(club.recent_activity_count);

  // 5. 카테고리 선호도
  const categoryPreferenceScore = calculateCategoryPreferenceScore(
    userProfile.hobby_tags,
    club.category
  );

  // 종합 점수 계산
  const breakdown = {
    tagMatch: tagMatchScore,
    socialGraph: socialGraphScore,
    memberComposition: memberCompositionScore,
    activityLevel: activityScore,
    categoryPreference: categoryPreferenceScore,
  };

  const totalScore =
    breakdown.tagMatch * weights.tagMatch +
    breakdown.socialGraph * weights.socialGraph +
    breakdown.memberComposition * weights.memberComposition +
    breakdown.activityLevel * weights.activityLevel +
    breakdown.categoryPreference * weights.categoryPreference;

  // 추천 이유 생성
  const reasons = generateRecommendationReasons(
    breakdown,
    socialMatchCount,
    club
  );

  return {
    club,
    score: Math.round(totalScore * 100) / 100, // 소수점 2자리
    reasons,
    breakdown,
  };
}

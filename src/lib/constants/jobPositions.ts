/**
 * 직급 상수
 * organization.json의 직급 데이터 기반
 */

// 직급 카테고리별 분류
export const JOB_POSITION_CATEGORIES = {
  executive: ["사장", "부사장", "전무", "상무", "이사", "전문위원"] as const,
  management: ["부장", "차장", "과장", "대리"] as const,
  research: ["수석연구원", "책임연구원", "선임연구원", "전임연구원"] as const,
  general: ["사원", "매니저", "인턴"] as const,
  overseas: ["총경리", "총감", "부총감", "실장"] as const,
} as const;

// 전체 직급 목록 (순서: 임원 → 관리직 → 연구직 → 일반직 → 해외)
export const JOB_POSITIONS = [
  ...JOB_POSITION_CATEGORIES.executive,
  ...JOB_POSITION_CATEGORIES.management,
  ...JOB_POSITION_CATEGORIES.research,
  ...JOB_POSITION_CATEGORIES.general,
  ...JOB_POSITION_CATEGORIES.overseas,
] as const;

export type JobPosition = (typeof JOB_POSITIONS)[number];
export type JobPositionCategory = keyof typeof JOB_POSITION_CATEGORIES;

// 직급 카테고리 가져오기
export function getJobPositionCategory(position: string): JobPositionCategory | undefined {
  for (const [category, positions] of Object.entries(JOB_POSITION_CATEGORIES)) {
    if ((positions as readonly string[]).includes(position)) {
      return category as JobPositionCategory;
    }
  }
  return undefined;
}

// 직급 레벨 (매칭 알고리즘용, 낮을수록 높은 직급)
export const JOB_POSITION_LEVELS: Record<string, number> = {
  // 임원 (Level 1-6)
  "사장": 1,
  "부사장": 2,
  "전무": 3,
  "상무": 4,
  "이사": 5,
  "전문위원": 6,
  // 관리직 (Level 7-10)
  "부장": 7,
  "차장": 8,
  "과장": 9,
  "대리": 10,
  // 연구직 (Level 7-10, 관리직과 동등)
  "수석연구원": 7,
  "책임연구원": 8,
  "선임연구원": 9,
  "전임연구원": 10,
  // 일반직 (Level 11-13)
  "사원": 11,
  "매니저": 11,
  "인턴": 13,
  // 해외 직급 (매핑)
  "총경리": 5,  // 이사급
  "총감": 7,    // 부장급
  "부총감": 8,  // 차장급
  "실장": 7,    // 부장급
};

// 직급 레벨 차이 계산
export function getPositionLevelDiff(position1: string, position2: string): number {
  const level1 = JOB_POSITION_LEVELS[position1] ?? 10;
  const level2 = JOB_POSITION_LEVELS[position2] ?? 10;
  return Math.abs(level1 - level2);
}

// 같은 레벨인지 확인 (동료 관계)
export function isSameLevel(position1: string, position2: string): boolean {
  return getPositionLevelDiff(position1, position2) === 0;
}

// 인접 레벨인지 확인 (멘토/멘티 관계)
export function isAdjacentLevel(position1: string, position2: string): boolean {
  const diff = getPositionLevelDiff(position1, position2);
  return diff >= 1 && diff <= 2;
}

// 직급 표시용 라벨 (카테고리 포함)
export const JOB_POSITION_LABELS: Record<string, string> = {
  // 임원
  "사장": "사장 (임원)",
  "부사장": "부사장 (임원)",
  "전무": "전무 (임원)",
  "상무": "상무 (임원)",
  "이사": "이사 (임원)",
  "전문위원": "전문위원 (임원)",
  // 관리직
  "부장": "부장",
  "차장": "차장",
  "과장": "과장",
  "대리": "대리",
  // 연구직
  "수석연구원": "수석연구원",
  "책임연구원": "책임연구원",
  "선임연구원": "선임연구원",
  "전임연구원": "전임연구원",
  // 일반직
  "사원": "사원",
  "매니저": "매니저",
  "인턴": "인턴",
  // 해외
  "총경리": "총경리 (해외)",
  "총감": "총감 (해외)",
  "부총감": "부총감 (해외)",
  "실장": "실장 (해외)",
};

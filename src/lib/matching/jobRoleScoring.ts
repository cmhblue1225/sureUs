/**
 * Job Role/Position Scoring System
 * Updated to use company job positions (직급)
 *
 * Scoring Tiers:
 * - 0.8: Same level (peer collaboration - 동료)
 * - 1.0: Adjacent level (mentor/mentee potential - 멘토/멘티)
 * - 0.6: Same category (related positions)
 * - 0.4: Different categories
 */

import {
  JOB_POSITION_CATEGORIES,
  JOB_POSITION_LEVELS,
  getJobPositionCategory,
  getPositionLevelDiff,
  isSameLevel,
  isAdjacentLevel,
} from "@/lib/constants/jobPositions";

// Legacy role categories for backward compatibility
const LEGACY_DEVELOPER_ROLES = [
  "백엔드 개발자",
  "프론트엔드 개발자",
  "풀스택 개발자",
  "모바일 개발자",
];

const LEGACY_DATA_ROLES = [
  "데이터 엔지니어",
  "데이터 사이언티스트",
  "ML 엔지니어",
];

const LEGACY_DESIGN_ROLES = [
  "UX 디자이너",
  "UI 디자이너",
  "그래픽 디자이너",
];

const LEGACY_MANAGEMENT_ROLES = [
  "프로덕트 매니저",
  "프로젝트 매니저",
];

// Legacy complementary role mappings
const LEGACY_COMPLEMENTARY_ROLES: Record<string, string[]> = {
  "백엔드 개발자": ["프론트엔드 개발자", "데이터 엔지니어", "모바일 개발자"],
  "프론트엔드 개발자": ["백엔드 개발자", "UX 디자이너", "UI 디자이너"],
  "QA 엔지니어": ["백엔드 개발자", "프론트엔드 개발자", "프로덕트 매니저"],
  "프로덕트 매니저": ["UX 디자이너", "백엔드 개발자", "프론트엔드 개발자"],
};

/**
 * Check if a role is a new company position (직급)
 */
function isCompanyPosition(role: string): boolean {
  return role in JOB_POSITION_LEVELS;
}

/**
 * Calculate job role/position score between two roles
 * Supports both new positions (직급) and legacy roles
 * @param role1 First job role/position
 * @param role2 Second job role/position
 * @returns Score (0-1)
 */
export function calculateJobRoleScore(
  role1: string | null | undefined,
  role2: string | null | undefined
): number {
  if (!role1 || !role2) {
    return 0.5; // Neutral if missing
  }

  // Check if both are new company positions
  const isPosition1 = isCompanyPosition(role1);
  const isPosition2 = isCompanyPosition(role2);

  if (isPosition1 && isPosition2) {
    // Use new position-based scoring

    // Same position - peer collaboration
    if (role1 === role2) {
      return 0.8;
    }

    // Adjacent level - mentor/mentee potential (highest value)
    if (isAdjacentLevel(role1, role2)) {
      return 1.0;
    }

    // Same category (연구직/관리직 등)
    const category1 = getJobPositionCategory(role1);
    const category2 = getJobPositionCategory(role2);

    if (category1 && category1 === category2) {
      return 0.6;
    }

    // Research-Management synergy (연구직-관리직 시너지)
    if (
      (category1 === "research" && category2 === "management") ||
      (category1 === "management" && category2 === "research")
    ) {
      return 0.7;
    }

    // Different categories
    return 0.4;
  }

  // Legacy role handling
  // Same role - peer collaboration
  if (role1 === role2) {
    return 0.6;
  }

  // Check if complementary roles
  const complementaryRoles = LEGACY_COMPLEMENTARY_ROLES[role1] || [];
  if (complementaryRoles.includes(role2)) {
    return 1.0;
  }

  // Check reverse complementary
  const reverseComplementary = LEGACY_COMPLEMENTARY_ROLES[role2] || [];
  if (reverseComplementary.includes(role1)) {
    return 1.0;
  }

  // Check same category
  if (
    (LEGACY_DEVELOPER_ROLES.includes(role1) && LEGACY_DEVELOPER_ROLES.includes(role2)) ||
    (LEGACY_DATA_ROLES.includes(role1) && LEGACY_DATA_ROLES.includes(role2)) ||
    (LEGACY_DESIGN_ROLES.includes(role1) && LEGACY_DESIGN_ROLES.includes(role2)) ||
    (LEGACY_MANAGEMENT_ROLES.includes(role1) && LEGACY_MANAGEMENT_ROLES.includes(role2))
  ) {
    return 0.5;
  }

  // Different roles - basic cross-functional potential
  return 0.3;
}

/**
 * Get the role/position category
 * Supports both new positions and legacy roles
 */
export function getRoleCategory(role: string): string | null {
  // Check new company positions first
  const positionCategory = getJobPositionCategory(role);
  if (positionCategory) {
    const categoryLabels: Record<string, string> = {
      executive: "임원",
      management: "관리직",
      research: "연구직",
      general: "일반직",
      overseas: "해외직",
    };
    return categoryLabels[positionCategory] || positionCategory;
  }

  // Legacy role categories
  if (LEGACY_DEVELOPER_ROLES.includes(role)) return "개발";
  if (LEGACY_DATA_ROLES.includes(role)) return "데이터";
  if (LEGACY_DESIGN_ROLES.includes(role)) return "디자인";
  if (LEGACY_MANAGEMENT_ROLES.includes(role)) return "관리";
  if (role === "QA 엔지니어") return "QA";

  return null;
}

/**
 * Check if two roles are in the same category
 */
export function isSameRoleCategory(
  role1: string | null | undefined,
  role2: string | null | undefined
): boolean {
  if (!role1 || !role2) return false;

  // Check new positions first
  const category1 = getJobPositionCategory(role1);
  const category2 = getJobPositionCategory(role2);

  if (category1 && category2) {
    return category1 === category2;
  }

  // Fall back to legacy role category check
  const legacyCategory1 = getRoleCategory(role1);
  const legacyCategory2 = getRoleCategory(role2);

  return legacyCategory1 !== null && legacyCategory1 === legacyCategory2;
}

/**
 * Get description of role/position relationship
 */
export function getJobRoleRelationship(
  role1: string | null | undefined,
  role2: string | null | undefined
): string {
  if (!role1 || !role2) {
    return "직급 정보 없음";
  }

  // Check if both are company positions
  const isPosition1 = isCompanyPosition(role1);
  const isPosition2 = isCompanyPosition(role2);

  if (isPosition1 && isPosition2) {
    if (role1 === role2) {
      return "동일 직급";
    }

    if (isAdjacentLevel(role1, role2)) {
      const level1 = JOB_POSITION_LEVELS[role1] ?? 10;
      const level2 = JOB_POSITION_LEVELS[role2] ?? 10;
      return level1 < level2 ? "멘토 관계" : "멘티 관계";
    }

    if (isSameLevel(role1, role2)) {
      return "동급 직급";
    }

    const category1 = getJobPositionCategory(role1);
    const category2 = getJobPositionCategory(role2);

    if (category1 === category2) {
      return "같은 직군";
    }

    if (
      (category1 === "research" && category2 === "management") ||
      (category1 === "management" && category2 === "research")
    ) {
      return "연구-관리 시너지";
    }

    return "다른 직군";
  }

  // Legacy role handling
  if (role1 === role2) {
    return "동일 직군";
  }

  const complementaryRoles = LEGACY_COMPLEMENTARY_ROLES[role1] || [];
  if (complementaryRoles.includes(role2)) {
    return "협업 직군";
  }

  const reverseComplementary = LEGACY_COMPLEMENTARY_ROLES[role2] || [];
  if (reverseComplementary.includes(role1)) {
    return "협업 직군";
  }

  if (isSameRoleCategory(role1, role2)) {
    return "관련 직군";
  }

  return "다른 직군";
}

/**
 * Get complementary roles/positions for a given role
 */
export function getComplementaryRoles(role: string): string[] {
  // For new positions, return adjacent level positions
  if (isCompanyPosition(role)) {
    const level = JOB_POSITION_LEVELS[role] ?? 10;
    return Object.entries(JOB_POSITION_LEVELS)
      .filter(([_, l]) => Math.abs(l - level) <= 2 && l !== level)
      .map(([pos]) => pos);
  }

  // Legacy roles
  return LEGACY_COMPLEMENTARY_ROLES[role] || [];
}

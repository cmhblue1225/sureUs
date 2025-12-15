/**
 * Job Role Scoring System
 * Considers both same-role and complementary-role synergies
 *
 * Scoring Tiers:
 * - 1.0: Complementary roles (high synergy potential)
 * - 0.6: Same role (peer collaboration)
 * - 0.5: Related roles (moderate synergy)
 * - 0.3: Different roles (basic cross-functional)
 */

// Role Categories
const DEVELOPER_ROLES = [
  "백엔드 개발자",
  "프론트엔드 개발자",
  "풀스택 개발자",
  "모바일 개발자",
];

const DATA_ROLES = [
  "데이터 엔지니어",
  "데이터 사이언티스트",
  "ML 엔지니어",
];

const INFRA_ROLES = [
  "DevOps 엔지니어",
  "SRE",
  "보안 엔지니어",
];

const DESIGN_ROLES = [
  "UX 디자이너",
  "UI 디자이너",
  "그래픽 디자이너",
];

const MANAGEMENT_ROLES = [
  "프로덕트 매니저",
  "프로젝트 매니저",
];

const BUSINESS_ROLES = [
  "마케터",
  "영업 담당자",
  "HR 담당자",
  "재무 담당자",
];

// Complementary role mappings (roles that work best together)
const COMPLEMENTARY_ROLES: Record<string, string[]> = {
  // Development
  "백엔드 개발자": ["프론트엔드 개발자", "DevOps 엔지니어", "데이터 엔지니어", "모바일 개발자"],
  "프론트엔드 개발자": ["백엔드 개발자", "UX 디자이너", "UI 디자이너", "모바일 개발자"],
  "풀스택 개발자": ["UX 디자이너", "DevOps 엔지니어", "프로덕트 매니저"],
  "모바일 개발자": ["백엔드 개발자", "UI 디자이너", "UX 디자이너"],

  // Data & ML
  "데이터 엔지니어": ["데이터 사이언티스트", "백엔드 개발자", "ML 엔지니어"],
  "데이터 사이언티스트": ["데이터 엔지니어", "ML 엔지니어", "프로덕트 매니저"],
  "ML 엔지니어": ["데이터 사이언티스트", "백엔드 개발자", "DevOps 엔지니어"],

  // Infrastructure
  "DevOps 엔지니어": ["백엔드 개발자", "SRE", "보안 엔지니어"],
  "SRE": ["DevOps 엔지니어", "백엔드 개발자", "보안 엔지니어"],
  "보안 엔지니어": ["DevOps 엔지니어", "SRE", "백엔드 개발자"],

  // Quality
  "QA 엔지니어": ["백엔드 개발자", "프론트엔드 개발자", "프로덕트 매니저"],

  // Design
  "UX 디자이너": ["프론트엔드 개발자", "프로덕트 매니저", "UI 디자이너"],
  "UI 디자이너": ["프론트엔드 개발자", "UX 디자이너", "그래픽 디자이너"],
  "그래픽 디자이너": ["UI 디자이너", "마케터"],

  // Management
  "프로덕트 매니저": ["UX 디자이너", "백엔드 개발자", "프론트엔드 개발자", "데이터 사이언티스트"],
  "프로젝트 매니저": ["프로덕트 매니저", "백엔드 개발자", "프론트엔드 개발자"],

  // Business
  "마케터": ["그래픽 디자이너", "데이터 사이언티스트", "프로덕트 매니저"],
  "영업 담당자": ["마케터", "프로덕트 매니저"],
  "HR 담당자": ["프로젝트 매니저"],
  "재무 담당자": ["프로젝트 매니저"],
};

// Related role mappings (same category but not direct collaboration)
const RELATED_ROLES: Record<string, string[]> = {
  "백엔드 개발자": [...DEVELOPER_ROLES.filter(r => r !== "백엔드 개발자"), ...DATA_ROLES],
  "프론트엔드 개발자": [...DEVELOPER_ROLES.filter(r => r !== "프론트엔드 개발자"), ...DESIGN_ROLES],
  "풀스택 개발자": [...DEVELOPER_ROLES.filter(r => r !== "풀스택 개발자")],
  "모바일 개발자": [...DEVELOPER_ROLES.filter(r => r !== "모바일 개발자")],

  "데이터 엔지니어": [...DATA_ROLES.filter(r => r !== "데이터 엔지니어"), ...INFRA_ROLES],
  "데이터 사이언티스트": [...DATA_ROLES.filter(r => r !== "데이터 사이언티스트")],
  "ML 엔지니어": [...DATA_ROLES.filter(r => r !== "ML 엔지니어"), ...INFRA_ROLES],

  "DevOps 엔지니어": [...INFRA_ROLES.filter(r => r !== "DevOps 엔지니어")],
  "SRE": [...INFRA_ROLES.filter(r => r !== "SRE")],
  "보안 엔지니어": [...INFRA_ROLES.filter(r => r !== "보안 엔지니어")],

  "QA 엔지니어": [...DEVELOPER_ROLES],

  "UX 디자이너": [...DESIGN_ROLES.filter(r => r !== "UX 디자이너")],
  "UI 디자이너": [...DESIGN_ROLES.filter(r => r !== "UI 디자이너")],
  "그래픽 디자이너": [...DESIGN_ROLES.filter(r => r !== "그래픽 디자이너")],

  "프로덕트 매니저": [...MANAGEMENT_ROLES.filter(r => r !== "프로덕트 매니저")],
  "프로젝트 매니저": [...MANAGEMENT_ROLES.filter(r => r !== "프로젝트 매니저")],

  "마케터": [...BUSINESS_ROLES.filter(r => r !== "마케터")],
  "영업 담당자": [...BUSINESS_ROLES.filter(r => r !== "영업 담당자")],
  "HR 담당자": [...BUSINESS_ROLES.filter(r => r !== "HR 담당자")],
  "재무 담당자": [...BUSINESS_ROLES.filter(r => r !== "재무 담당자")],
};

/**
 * Calculate job role score between two roles
 * @param role1 First job role
 * @param role2 Second job role
 * @returns Score (0-1)
 */
export function calculateJobRoleScore(
  role1: string | null | undefined,
  role2: string | null | undefined
): number {
  if (!role1 || !role2) {
    return 0.5; // Neutral if missing
  }

  // Same role - peer collaboration
  if (role1 === role2) {
    return 0.6;
  }

  // Check if complementary roles
  const complementaryRoles = COMPLEMENTARY_ROLES[role1] || [];
  if (complementaryRoles.includes(role2)) {
    return 1.0;
  }

  // Check reverse complementary
  const reverseComplementary = COMPLEMENTARY_ROLES[role2] || [];
  if (reverseComplementary.includes(role1)) {
    return 1.0;
  }

  // Check if related roles
  const relatedRoles = RELATED_ROLES[role1] || [];
  if (relatedRoles.includes(role2)) {
    return 0.5;
  }

  // Check reverse related
  const reverseRelated = RELATED_ROLES[role2] || [];
  if (reverseRelated.includes(role1)) {
    return 0.5;
  }

  // Different roles - basic cross-functional potential
  return 0.3;
}

/**
 * Get the role category
 */
export function getRoleCategory(role: string): string | null {
  if (DEVELOPER_ROLES.includes(role)) return "개발";
  if (DATA_ROLES.includes(role)) return "데이터";
  if (INFRA_ROLES.includes(role)) return "인프라";
  if (DESIGN_ROLES.includes(role)) return "디자인";
  if (MANAGEMENT_ROLES.includes(role)) return "관리";
  if (BUSINESS_ROLES.includes(role)) return "비즈니스";
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

  const category1 = getRoleCategory(role1);
  const category2 = getRoleCategory(role2);

  return category1 !== null && category1 === category2;
}

/**
 * Get description of role relationship
 */
export function getJobRoleRelationship(
  role1: string | null | undefined,
  role2: string | null | undefined
): string {
  if (!role1 || !role2) {
    return "직군 정보 없음";
  }

  if (role1 === role2) {
    return "동일 직군";
  }

  const complementaryRoles = COMPLEMENTARY_ROLES[role1] || [];
  if (complementaryRoles.includes(role2)) {
    return "협업 직군";
  }

  const reverseComplementary = COMPLEMENTARY_ROLES[role2] || [];
  if (reverseComplementary.includes(role1)) {
    return "협업 직군";
  }

  if (isSameRoleCategory(role1, role2)) {
    return "관련 직군";
  }

  return "다른 직군";
}

/**
 * Get complementary roles for a given role
 */
export function getComplementaryRoles(role: string): string[] {
  return COMPLEMENTARY_ROLES[role] || [];
}

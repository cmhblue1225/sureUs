/**
 * Department Scoring System
 * Considers cross-department synergies for networking potential
 * Updated to use company organization structure
 *
 * Scoring Tiers:
 * - 1.0: High synergy (연구소/센터 간 시너지 관계)
 * - 0.8: Same 연구소/센터, different 실
 * - 0.5: Same 실, different 팀
 * - 0.3: Same 팀 (peer networking)
 * - 0.4: No defined synergy
 */

import { ORG_SYNERGY_MAP } from "@/lib/constants/organization";

// Legacy department synergy mappings (하위 호환성)
const LEGACY_DEPARTMENT_SYNERGY: Record<string, { high: string[]; moderate: string[] }> = {
  "개발팀": {
    high: ["디자인팀", "기획팀", "데이터팀"],
    moderate: ["QA팀", "인프라팀", "보안팀"],
  },
  "디자인팀": {
    high: ["개발팀", "기획팀", "마케팅팀"],
    moderate: ["고객지원팀"],
  },
  "기획팀": {
    high: ["개발팀", "디자인팀", "마케팅팀"],
    moderate: ["영업팀", "데이터팀"],
  },
  "QA팀": {
    high: ["개발팀"],
    moderate: ["기획팀", "디자인팀"],
  },
};

/**
 * Parse department string to extract org levels
 * Supports both new format ("시험자동화연구소 > Cloud실 > Frontend팀") and legacy format
 */
function parseOrgPath(dept: string): { level1: string; level2?: string; level3?: string } {
  const parts = dept.split(" > ").map(p => p.trim());
  return {
    level1: parts[0] || dept,
    level2: parts[1],
    level3: parts[2],
  };
}

/**
 * Calculate department score between two departments
 * Updated to use new organization structure synergy
 *
 * @param dept1 First department (can be full path or level1 only)
 * @param dept2 Second department (can be full path or level1 only)
 * @param preferCrossDepartment Whether to prefer cross-department connections
 * @returns Score (0-1)
 */
export function calculateDepartmentScore(
  dept1: string | null | undefined,
  dept2: string | null | undefined,
  preferCrossDepartment: boolean = true
): number {
  if (!dept1 || !dept2) {
    return 0.5; // Neutral if missing
  }

  // Parse department paths
  const org1 = parseOrgPath(dept1);
  const org2 = parseOrgPath(dept2);

  // Same 팀 (team)
  if (org1.level1 === org2.level1 && org1.level2 === org2.level2 && org1.level3 === org2.level3 && org1.level3) {
    return preferCrossDepartment ? 0.3 : 0.6;
  }

  // Same 실 (division), different 팀
  if (org1.level1 === org2.level1 && org1.level2 === org2.level2 && org1.level2) {
    return preferCrossDepartment ? 0.5 : 0.7;
  }

  // Same 연구소/센터 (level1), different 실
  if (org1.level1 === org2.level1) {
    return preferCrossDepartment ? 0.8 : 0.6;
  }

  // Different 연구소/센터 - check synergy map
  const synergy1 = ORG_SYNERGY_MAP[org1.level1];
  const synergy2 = ORG_SYNERGY_MAP[org2.level1];

  // High synergy - bidirectional check
  if (synergy1?.includes(org2.level1) || synergy2?.includes(org1.level1)) {
    return 1.0;
  }

  // Try legacy mapping for backward compatibility
  const legacySynergy1 = LEGACY_DEPARTMENT_SYNERGY[dept1];
  const legacySynergy2 = LEGACY_DEPARTMENT_SYNERGY[dept2];

  if (legacySynergy1?.high.includes(dept2) || legacySynergy2?.high.includes(dept1)) {
    return 1.0;
  }

  if (legacySynergy1?.moderate.includes(dept2) || legacySynergy2?.moderate.includes(dept1)) {
    return 0.7;
  }

  // Different department with no defined synergy
  return preferCrossDepartment ? 0.4 : 0.3;
}

/**
 * Get synergy level description
 */
export function getDepartmentSynergyDescription(
  dept1: string | null | undefined,
  dept2: string | null | undefined
): string {
  if (!dept1 || !dept2) {
    return "소속 정보 없음";
  }

  const org1 = parseOrgPath(dept1);
  const org2 = parseOrgPath(dept2);

  // Same 팀
  if (org1.level1 === org2.level1 && org1.level2 === org2.level2 && org1.level3 === org2.level3 && org1.level3) {
    return "같은 팀";
  }

  // Same 실
  if (org1.level1 === org2.level1 && org1.level2 === org2.level2 && org1.level2) {
    return "같은 실";
  }

  // Same 연구소/센터
  if (org1.level1 === org2.level1) {
    return "같은 연구소/센터";
  }

  // Check synergy
  const synergy1 = ORG_SYNERGY_MAP[org1.level1];
  const synergy2 = ORG_SYNERGY_MAP[org2.level1];

  if (synergy1?.includes(org2.level1) || synergy2?.includes(org1.level1)) {
    return "높은 시너지 조직";
  }

  return "다른 조직";
}

/**
 * Get high synergy organizations for a given org level1
 */
export function getHighSynergyOrganizations(orgLevel1: string): string[] {
  return ORG_SYNERGY_MAP[orgLevel1] || [];
}

/**
 * Check if two organizations have high synergy
 */
export function hasHighSynergy(
  dept1: string | null | undefined,
  dept2: string | null | undefined
): boolean {
  if (!dept1 || !dept2) return false;

  const org1 = parseOrgPath(dept1);
  const org2 = parseOrgPath(dept2);

  if (org1.level1 === org2.level1) return false;

  const synergy1 = ORG_SYNERGY_MAP[org1.level1];
  const synergy2 = ORG_SYNERGY_MAP[org2.level1];

  return synergy1?.includes(org2.level1) || synergy2?.includes(org1.level1) || false;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getHighSynergyOrganizations instead
 */
export function getHighSynergyDepartments(dept: string): string[] {
  const org = parseOrgPath(dept);
  return ORG_SYNERGY_MAP[org.level1] || LEGACY_DEPARTMENT_SYNERGY[dept]?.high || [];
}

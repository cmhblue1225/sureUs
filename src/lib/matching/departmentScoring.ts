/**
 * Department Scoring System
 * Considers cross-department synergies for networking potential
 *
 * Scoring Tiers:
 * - 1.0: High synergy departments (dev-design, design-marketing, etc.)
 * - 0.7: Moderate synergy
 * - 0.5: Same department (peer networking)
 * - 0.3: Low synergy
 */

// Department synergy mappings
// Cross-department collaboration is often more valuable for networking
const DEPARTMENT_SYNERGY: Record<string, { high: string[]; moderate: string[] }> = {
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
  "마케팅팀": {
    high: ["디자인팀", "기획팀", "영업팀"],
    moderate: ["데이터팀"],
  },
  "영업팀": {
    high: ["마케팅팀", "기획팀"],
    moderate: ["고객지원팀"],
  },
  "인사팀": {
    high: ["경영지원팀"],
    moderate: ["재무팀", "운영팀"],
  },
  "재무팀": {
    high: ["경영지원팀"],
    moderate: ["인사팀", "운영팀"],
  },
  "운영팀": {
    high: ["경영지원팀", "고객지원팀"],
    moderate: ["인사팀", "재무팀"],
  },
  "고객지원팀": {
    high: ["운영팀", "기획팀"],
    moderate: ["개발팀", "영업팀"],
  },
  "QA팀": {
    high: ["개발팀"],
    moderate: ["기획팀", "디자인팀"],
  },
  "데이터팀": {
    high: ["개발팀", "마케팅팀"],
    moderate: ["기획팀", "영업팀"],
  },
  "보안팀": {
    high: ["인프라팀", "개발팀"],
    moderate: ["운영팀"],
  },
  "인프라팀": {
    high: ["개발팀", "보안팀"],
    moderate: ["데이터팀"],
  },
  "경영지원팀": {
    high: ["인사팀", "재무팀", "운영팀"],
    moderate: [],
  },
};

/**
 * Calculate department score between two departments
 * Cross-department networking is encouraged over same-department
 *
 * @param dept1 First department
 * @param dept2 Second department
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

  // Same department
  if (dept1 === dept2) {
    // If user prefers cross-department, same dept gets lower score
    return preferCrossDepartment ? 0.5 : 0.7;
  }

  // Check synergy mappings
  const synergy1 = DEPARTMENT_SYNERGY[dept1];
  const synergy2 = DEPARTMENT_SYNERGY[dept2];

  // High synergy - bidirectional check
  if (synergy1?.high.includes(dept2) || synergy2?.high.includes(dept1)) {
    return 1.0;
  }

  // Moderate synergy - bidirectional check
  if (synergy1?.moderate.includes(dept2) || synergy2?.moderate.includes(dept1)) {
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
    return "부서 정보 없음";
  }

  if (dept1 === dept2) {
    return "같은 부서";
  }

  const synergy1 = DEPARTMENT_SYNERGY[dept1];
  const synergy2 = DEPARTMENT_SYNERGY[dept2];

  if (synergy1?.high.includes(dept2) || synergy2?.high.includes(dept1)) {
    return "높은 시너지 부서";
  }

  if (synergy1?.moderate.includes(dept2) || synergy2?.moderate.includes(dept1)) {
    return "협업 가능 부서";
  }

  return "다른 부서";
}

/**
 * Get high synergy departments for a given department
 */
export function getHighSynergyDepartments(dept: string): string[] {
  return DEPARTMENT_SYNERGY[dept]?.high || [];
}

/**
 * Check if two departments have high synergy
 */
export function hasHighSynergy(
  dept1: string | null | undefined,
  dept2: string | null | undefined
): boolean {
  if (!dept1 || !dept2) return false;
  if (dept1 === dept2) return false;

  const synergy1 = DEPARTMENT_SYNERGY[dept1];
  const synergy2 = DEPARTMENT_SYNERGY[dept2];

  return synergy1?.high.includes(dept2) || synergy2?.high.includes(dept1) || false;
}

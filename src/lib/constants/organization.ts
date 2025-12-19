/**
 * 조직 구조 상수
 * organization.json 기반으로 생성됨
 */

export interface OrganizationUnit {
  id: string;
  name: string;
  children?: OrganizationUnit[];
}

// 전체 조직 구조
export const ORGANIZATION_STRUCTURE: OrganizationUnit[] = [
  {
    id: "test-automation-lab",
    name: "시험자동화연구소",
    children: [
      {
        id: "intelligent-automation",
        name: "지능형시험자동화실",
        children: [
          { id: "static-analysis", name: "정적분석기술팀" },
          { id: "ai-tech", name: "AI기술팀" },
          { id: "dynamic-analysis", name: "동적분석기술팀" },
        ],
      },
      {
        id: "dynamic",
        name: "Dynamic실",
        children: [
          { id: "engine", name: "엔진팀" },
          { id: "platform-dynamic", name: "플랫폼팀" },
        ],
      },
      {
        id: "cloud",
        name: "Cloud실",
        children: [
          { id: "frontend", name: "Frontend팀" },
          { id: "backend", name: "Backend팀" },
          { id: "analysis-engine", name: "분석엔진팀" },
          { id: "pl", name: "PL팀" },
        ],
      },
      {
        id: "process-automation",
        name: "프로세스자동화실",
        children: [
          { id: "vpes", name: "VPES팀" },
          { id: "vspice", name: "VSPICE팀" },
        ],
      },
    ],
  },
  {
    id: "embedded-tech-lab",
    name: "임베디드기술연구소",
    children: [
      {
        id: "virtualization",
        name: "가상화기술실",
        children: [
          { id: "virtualization-platform", name: "가상화플랫폼팀" },
          { id: "virtualization-solution", name: "가상화솔루션팀" },
        ],
      },
      {
        id: "vehicle-verification",
        name: "차량검증자동화실",
        children: [
          { id: "network-tech", name: "네트워크기술팀" },
          { id: "control-logic", name: "제어로직개발팀" },
          { id: "vehicle-solution-1", name: "차량솔루션1팀" },
          { id: "vehicle-solution-2", name: "차량솔루션2팀" },
        ],
      },
      {
        id: "future-tech",
        name: "미래기술개발실",
        children: [
          { id: "defense-simulation", name: "국방시뮬레이션팀" },
          { id: "vehicle-simulation", name: "차량시뮬레이션팀" },
          { id: "cloud-analysis", name: "클라우드분석팀" },
          { id: "robotics", name: "로보틱스개발팀" },
          { id: "data-solution", name: "데이터솔루션팀" },
        ],
      },
    ],
  },
  {
    id: "smart-mobility-center",
    name: "스마트모빌리티센터",
    children: [
      {
        id: "mobility-strategy",
        name: "모빌리티전략실",
        children: [
          { id: "mobility-sw-1", name: "모빌리티SW전략1팀" },
          { id: "mobility-sw-2", name: "모빌리티SW전략2팀" },
          { id: "mobility-sw-3", name: "모빌리티SW전략3팀" },
          { id: "mobility-sw-4", name: "모빌리티SW전략4팀" },
        ],
      },
      {
        id: "mobility-solution",
        name: "모빌리티솔루션실",
        children: [
          { id: "mobility-solution-1", name: "모빌리티솔루션1팀" },
          { id: "mobility-solution-2", name: "모빌리티솔루션2팀" },
          { id: "mobility-solution-3", name: "모빌리티솔루션3팀" },
          { id: "mobility-solution-4", name: "모빌리티솔루션4팀" },
        ],
      },
      {
        id: "mobility-control-verification",
        name: "모빌리티제어검증실",
        children: [
          { id: "mobility-control-1", name: "모빌리티제어검증1팀" },
          { id: "mobility-control-2", name: "모빌리티제어검증2팀" },
          { id: "mobility-control-3", name: "모빌리티제어검증3팀" },
        ],
      },
    ],
  },
  {
    id: "ax-center",
    name: "AX센터",
    children: [
      {
        id: "ax-new-business",
        name: "AX신사업실",
        children: [
          { id: "ax-verification-1", name: "AX검증기술1팀" },
          { id: "ax-verification-2", name: "AX검증기술2팀" },
          { id: "ax-application", name: "AX응용기술팀" },
          { id: "ax-quality", name: "AX품질기술팀" },
          { id: "sw-certification", name: "SW공인시험팀" },
        ],
      },
      {
        id: "aerospace-defense",
        name: "우주항공국방기술실",
        children: [
          { id: "aerospace-sw", name: "우주항공SW기술팀" },
          { id: "future-defense-sw", name: "미래국방SW기술팀" },
          { id: "future-defense-verification", name: "미래국방SW검증팀" },
        ],
      },
      {
        id: "energy-infra",
        name: "에너지인프라시스템실",
        children: [
          { id: "energy-verification-1", name: "에너지검증1팀" },
          { id: "energy-verification-2", name: "에너지검증2팀" },
          { id: "energy-verification-3", name: "에너지검증3팀" },
        ],
      },
      {
        id: "sdx-development",
        name: "SDx개발실",
        children: [
          { id: "controller-development", name: "제어기개발팀" },
          { id: "advanced-sw", name: "선행SW개발팀" },
          { id: "sdx-platform", name: "SDx플랫폼팀" },
        ],
      },
    ],
  },
  {
    id: "e-mobility-center",
    name: "E-모빌리티센터",
    children: [
      {
        id: "automotive-system",
        name: "Automotive시스템실",
        children: [
          { id: "automotive-verification-1", name: "Automotive검증1팀" },
          { id: "automotive-verification-2", name: "Automotive검증2팀" },
        ],
      },
      {
        id: "e-mobility-system",
        name: "E-모빌리티시스템실",
        children: [
          { id: "e-mobility-verification-1", name: "E-모빌리티검증1팀" },
          { id: "e-mobility-verification-2", name: "E-모빌리티검증2팀" },
          { id: "e-mobility-verification-3", name: "E-모빌리티검증3팀" },
        ],
      },
      {
        id: "sdv-system",
        name: "SDV시스템실",
        children: [
          { id: "sdv-solution-1", name: "SDV솔루션1팀" },
          { id: "sdv-solution-2", name: "SDV솔루션2팀" },
          { id: "sdv-solution-3", name: "SDV솔루션3팀" },
        ],
      },
    ],
  },
  {
    id: "business-development-hq",
    name: "사업개발본부",
    children: [
      {
        id: "business-development-division",
        name: "사업개발부문",
        children: [
          { id: "solution-integration-1", name: "솔루션통합지원1팀" },
          { id: "solution-integration-2", name: "솔루션통합지원2팀" },
          { id: "mobility-business-1", name: "모빌리티사업개발1팀" },
          { id: "mobility-business-2", name: "모빌리티사업개발2팀" },
          { id: "ax-business-1", name: "AX사업개발1팀" },
          { id: "ax-business-2", name: "AX사업개발2팀" },
        ],
      },
    ],
  },
  {
    id: "cso",
    name: "CSO",
    children: [
      {
        id: "strategy-planning",
        name: "전략기획실",
      },
    ],
  },
  {
    id: "cto",
    name: "CTO",
    children: [
      {
        id: "sqa",
        name: "SQA실",
      },
      {
        id: "cto-direct",
        name: "CTO직속",
      },
    ],
  },
  {
    id: "cfo",
    name: "CFO",
    children: [
      {
        id: "management-support",
        name: "경영지원실",
        children: [
          { id: "culture-infra", name: "컬쳐앤인프라팀" },
          { id: "people", name: "피플팀" },
        ],
      },
      {
        id: "financial-planning",
        name: "재무기획실",
        children: [
          { id: "accounting", name: "회계팀" },
          { id: "business-analysis", name: "사업분석팀" },
        ],
      },
      {
        id: "salary",
        name: "Salary팀",
      },
    ],
  },
  {
    id: "qa-assurance",
    name: "품질보증팀",
  },
  {
    id: "new-recruits",
    name: "공채 13기",
  },
  {
    id: "qingdao-sure",
    name: "청도슈어",
    children: [
      { id: "qingdao-finance", name: "청도_재무팀" },
      { id: "qingdao-planning", name: "청도_경영기획/평가" },
      { id: "qingdao-sales", name: "청도_영업팀" },
      { id: "qingdao-pm", name: "청도_PM Team" },
      {
        id: "qingdao-tech-center",
        name: "청도_Technical Center",
        children: [
          { id: "qingdao-code-model", name: "청도_Code/Model" },
          { id: "qingdao-veh-inter", name: "청도_Veh/Inter" },
          { id: "qingdao-ftu-dev", name: "청도_FTU Dev" },
          { id: "qingdao-platform", name: "청도_Platform Team" },
          { id: "qingdao-dev", name: "청도_Dev Team" },
        ],
      },
      { id: "qingdao-consulting", name: "청도_Consulting Team" },
    ],
  },
  {
    id: "outsourcing",
    name: "외주인력",
    children: [
      { id: "artlab", name: "아트랩소프트" },
      { id: "cools", name: "쿨스" },
      { id: "splex", name: "스플렉스" },
      { id: "bitnplus", name: "비트앤플러스" },
      { id: "durueids", name: "두루이디에스" },
      { id: "mobility-support", name: "모빌리티지원팀" },
    ],
  },
];

// Level 1 옵션 (연구소/센터/본부)
export const ORG_LEVEL1_OPTIONS = ORGANIZATION_STRUCTURE.map((org) => org.name);

// Level 1 ID로 조직 찾기
export function findOrgByLevel1(level1Name: string): OrganizationUnit | undefined {
  return ORGANIZATION_STRUCTURE.find((org) => org.name === level1Name);
}

// Level 2 옵션 가져오기 (실)
export function getOrgLevel2Options(level1Name: string): string[] {
  const org = findOrgByLevel1(level1Name);
  if (!org?.children) return [];
  return org.children.map((child) => child.name);
}

// Level 2 ID로 실 찾기
export function findOrgByLevel2(level1Name: string, level2Name: string): OrganizationUnit | undefined {
  const org = findOrgByLevel1(level1Name);
  return org?.children?.find((child) => child.name === level2Name);
}

// Level 3 옵션 가져오기 (팀)
export function getOrgLevel3Options(level1Name: string, level2Name: string): string[] {
  const level2 = findOrgByLevel2(level1Name, level2Name);
  if (!level2?.children) return [];
  return level2.children.map((child) => child.name);
}

// 전체 조직 경로 문자열 생성
export function getFullOrgPath(level1?: string, level2?: string, level3?: string): string {
  const parts = [level1, level2, level3].filter(Boolean);
  return parts.join(" > ");
}

// Level 2가 있는지 확인
export function hasLevel2(level1Name: string): boolean {
  const org = findOrgByLevel1(level1Name);
  return Boolean(org?.children && org.children.length > 0);
}

// Level 3가 있는지 확인
export function hasLevel3(level1Name: string, level2Name: string): boolean {
  const level2 = findOrgByLevel2(level1Name, level2Name);
  return Boolean(level2?.children && level2.children.length > 0);
}

// 조직 시너지 맵 (매칭 알고리즘용)
export const ORG_SYNERGY_MAP: Record<string, string[]> = {
  "시험자동화연구소": ["임베디드기술연구소", "E-모빌리티센터", "AX센터"],
  "임베디드기술연구소": ["시험자동화연구소", "스마트모빌리티센터", "E-모빌리티센터"],
  "스마트모빌리티센터": ["임베디드기술연구소", "E-모빌리티센터", "사업개발본부"],
  "AX센터": ["시험자동화연구소", "사업개발본부", "E-모빌리티센터"],
  "E-모빌리티센터": ["시험자동화연구소", "임베디드기술연구소", "스마트모빌리티센터"],
  "사업개발본부": ["스마트모빌리티센터", "AX센터", "E-모빌리티센터"],
  "CSO": ["CFO", "CTO", "사업개발본부"],
  "CTO": ["시험자동화연구소", "임베디드기술연구소", "CSO"],
  "CFO": ["CSO", "사업개발본부", "청도슈어"],
  "청도슈어": ["CFO", "사업개발본부"],
};

export type OrgLevel1 = (typeof ORG_LEVEL1_OPTIONS)[number];

/**
 * 조직명(팀, 실, 연구소)에서 상위 조직 찾기
 * 기존 department 값에서 org_level1/2/3을 추출하는 용도
 */
export interface OrgHierarchy {
  level1: string;
  level2?: string;
  level3?: string;
}

export function findOrgHierarchyByName(name: string): OrgHierarchy | null {
  if (!name) return null;

  // Level 1 (연구소/센터/본부)에서 먼저 찾기
  for (const org of ORGANIZATION_STRUCTURE) {
    if (org.name === name) {
      return { level1: org.name };
    }

    // Level 2 (실)에서 찾기
    if (org.children) {
      for (const level2 of org.children) {
        if (level2.name === name) {
          return { level1: org.name, level2: level2.name };
        }

        // Level 3 (팀)에서 찾기
        if (level2.children) {
          for (const level3 of level2.children) {
            if (level3.name === name) {
              return { level1: org.name, level2: level2.name, level3: level3.name };
            }
          }
        }
      }
    }
  }

  return null;
}

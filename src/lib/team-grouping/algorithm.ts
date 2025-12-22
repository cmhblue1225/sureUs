/**
 * Team Grouping Algorithm
 *
 * 조 편성 기준에 따라 최적의 팀을 생성하는 알고리즘
 */

import { getMbtiCompatibility } from "@/lib/matching/mbtiCompatibility";
import { calculateLocationScore } from "@/lib/matching/locationScoring";
import { calculateDepartmentScore } from "@/lib/matching/departmentScoring";
import { calculateJobRoleScore } from "@/lib/matching/jobRoleScoring";
import {
  GroupingCriteria,
  TeamMember,
  GeneratedTeam,
  TeamGroupingResult,
  CriteriaWeights,
  DEFAULT_CRITERIA_WEIGHTS,
} from "./types";

/**
 * 두 멤버 간의 기준별 적합도 점수 계산
 */
function calculatePairScore(
  member1: TeamMember,
  member2: TeamMember,
  criteria: GroupingCriteria
): number {
  let totalScore = 0;
  let totalWeight = 0;

  // 부서 점수
  if (criteria.diverseDepartments) {
    // 다른 부서일수록 높은 점수
    const isDifferent = member1.department !== member2.department;
    totalScore += isDifferent ? 1.0 : 0.2;
    totalWeight += 1;
  } else if (criteria.similarDepartments) {
    // 같은 부서일수록 높은 점수
    const departmentScore = calculateDepartmentScore(
      member1.department,
      member2.department,
      false // preferCrossDepartment = false
    );
    totalScore += departmentScore;
    totalWeight += 1;
  }

  // MBTI 점수
  if (criteria.similarMbti) {
    // MBTI 궁합 좋을수록 높은 점수
    if (member1.mbti && member2.mbti) {
      const compatibility = getMbtiCompatibility(member1.mbti, member2.mbti);
      totalScore += compatibility;
      totalWeight += 1;
    }
  } else if (criteria.diverseMbti) {
    // MBTI가 다를수록 높은 점수 (같은 기질 그룹이면 낮은 점수)
    if (member1.mbti && member2.mbti) {
      const isSame = member1.mbti === member2.mbti;
      const isSameTemperament = areSameTemperament(member1.mbti, member2.mbti);
      totalScore += isSame ? 0.1 : isSameTemperament ? 0.4 : 1.0;
      totalWeight += 1;
    }
  }

  // 지역 점수
  if (criteria.sameLocation) {
    // 같은 지역일수록 높은 점수
    const locationScore = calculateLocationScore(
      member1.officeLocation,
      member2.officeLocation
    );
    totalScore += locationScore;
    totalWeight += 1;
  } else if (criteria.mixedLocations) {
    // 다른 지역일수록 높은 점수
    const isDifferent = member1.officeLocation !== member2.officeLocation;
    totalScore += isDifferent ? 1.0 : 0.3;
    totalWeight += 1;
  }

  // 직급 점수
  if (criteria.mixedJobLevels) {
    // 인접 직급 (멘토-멘티)일수록 높은 점수
    const jobRoleScore = calculateJobRoleScore(
      member1.jobRole,
      member2.jobRole
    );
    // jobRoleScore는 인접 레벨에서 높은 점수를 반환
    totalScore += jobRoleScore;
    totalWeight += 1;
  } else if (criteria.sameJobLevels) {
    // 같은 직급일수록 높은 점수
    const isSame = member1.jobRole === member2.jobRole;
    totalScore += isSame ? 1.0 : 0.4;
    totalWeight += 1;
  }

  // 가중치가 없으면 (기준 없음) 무작위 = 0.5
  if (totalWeight === 0) {
    return 0.5;
  }

  return totalScore / totalWeight;
}

/**
 * MBTI 기질 그룹 확인
 */
function areSameTemperament(mbti1: string, mbti2: string): boolean {
  const NT = ["INTJ", "INTP", "ENTJ", "ENTP"];
  const NF = ["INFJ", "INFP", "ENFJ", "ENFP"];
  const SJ = ["ISTJ", "ISFJ", "ESTJ", "ESFJ"];
  const SP = ["ISTP", "ISFP", "ESTP", "ESFP"];

  const groups = [NT, NF, SJ, SP];
  for (const group of groups) {
    if (group.includes(mbti1) && group.includes(mbti2)) {
      return true;
    }
  }
  return false;
}

/**
 * 팀에 멤버를 추가했을 때의 적합도 점수 계산
 */
function calculateTeamFitScore(
  candidate: TeamMember,
  team: TeamMember[],
  criteria: GroupingCriteria
): number {
  if (team.length === 0) {
    return 0.5; // 빈 팀에는 누구나 동일
  }

  // 팀의 모든 멤버와의 평균 점수
  const scores = team.map((member) =>
    calculatePairScore(candidate, member, criteria)
  );
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * 팀의 다양성 통계 계산
 */
function calculateTeamDiversity(team: TeamMember[]): GeneratedTeam["diversity"] {
  const departments = new Set(team.map((m) => m.department));
  const mbtis = new Set(team.map((m) => m.mbti).filter(Boolean));
  const locations = new Set(team.map((m) => m.officeLocation));

  return {
    departmentCount: departments.size,
    mbtiCount: mbtis.size,
    locationCount: locations.size,
  };
}

/**
 * 팀 내 평균 적합도 점수 계산
 */
function calculateTeamAverageSimilarity(
  team: TeamMember[],
  criteria: GroupingCriteria
): number {
  if (team.length <= 1) return 1;

  let totalScore = 0;
  let pairCount = 0;

  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      totalScore += calculatePairScore(team[i], team[j], criteria);
      pairCount++;
    }
  }

  return pairCount > 0 ? totalScore / pairCount : 1;
}

/**
 * 멤버 배열을 섞는 함수 (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Greedy 알고리즘으로 팀 생성
 */
function greedyTeamAssignment(
  members: TeamMember[],
  teamSize: number,
  criteria: GroupingCriteria
): { teams: TeamMember[][]; ungrouped: TeamMember[] } {
  const shuffledMembers = shuffleArray(members);
  const teamCount = Math.floor(shuffledMembers.length / teamSize);

  // 팀 초기화
  const teams: TeamMember[][] = Array.from({ length: teamCount }, () => []);
  const assignedIds = new Set<string>();

  // similarDepartments: 같은 부서끼리 팀 구성 (특별 처리)
  if (criteria.similarDepartments) {
    // 부서별로 그룹화
    const membersByDept = new Map<string, TeamMember[]>();
    shuffledMembers.forEach((m) => {
      const key = m.department || "unknown";
      if (!membersByDept.has(key)) membersByDept.set(key, []);
      membersByDept.get(key)!.push(m);
    });

    // 부서별 멤버 수가 많은 순으로 정렬
    const deptEntries = Array.from(membersByDept.entries())
      .sort((a, b) => b[1].length - a[1].length);

    let teamIdx = 0;
    const remainders: TeamMember[] = []; // 팀을 채우지 못한 나머지

    // 1단계: 각 부서별로 완전한 팀 생성
    for (const [_dept, deptMembers] of deptEntries) {
      const queue = shuffleArray([...deptMembers]);

      // 해당 부서로 채울 수 있는 팀 수
      while (queue.length >= teamSize && teamIdx < teams.length) {
        for (let i = 0; i < teamSize; i++) {
          const member = queue.shift()!;
          teams[teamIdx].push(member);
          assignedIds.add(member.id);
        }
        teamIdx++;
      }

      // 나머지는 remainders에 추가
      remainders.push(...queue);
    }

    // 2단계: 나머지 멤버들을 빈 팀에 배치 (같은 부서끼리 최대한)
    // 나머지를 부서별로 다시 그룹화
    const remaindersByDept = new Map<string, TeamMember[]>();
    remainders.forEach((m) => {
      const key = m.department || "unknown";
      if (!remaindersByDept.has(key)) remaindersByDept.set(key, []);
      remaindersByDept.get(key)!.push(m);
    });

    // 나머지 부서들을 크기순 정렬
    const remainderEntries = Array.from(remaindersByDept.entries())
      .sort((a, b) => b[1].length - a[1].length);

    // 빈 팀에 나머지 배치
    for (const [_dept, deptRemainders] of remainderEntries) {
      for (const member of deptRemainders) {
        if (assignedIds.has(member.id)) continue;

        // 같은 부서가 있는 미완성 팀 찾기
        let placed = false;
        for (let i = teamIdx; i < teams.length; i++) {
          if (teams[i].length >= teamSize) continue;
          if (teams[i].length > 0 && teams[i].some((m) => m.department === member.department)) {
            teams[i].push(member);
            assignedIds.add(member.id);
            placed = true;
            break;
          }
        }

        // 없으면 가장 작은 빈 팀에 배치
        if (!placed) {
          let minIdx = -1;
          let minSize = teamSize + 1;
          for (let i = teamIdx; i < teams.length; i++) {
            if (teams[i].length < teamSize && teams[i].length < minSize) {
              minSize = teams[i].length;
              minIdx = i;
            }
          }
          if (minIdx >= 0) {
            teams[minIdx].push(member);
            assignedIds.add(member.id);
          }
        }
      }
    }

    const ungrouped = shuffledMembers.filter((m) => !assignedIds.has(m.id));
    return { teams, ungrouped };
  }

  // diverseDepartments: 다양한 부서 분산 배치
  if (criteria.diverseDepartments || criteria.diverseMbti || criteria.mixedLocations) {
    const membersByDept = new Map<string, TeamMember[]>();
    shuffledMembers.forEach((m) => {
      const key = m.department || "unknown";
      if (!membersByDept.has(key)) membersByDept.set(key, []);
      membersByDept.get(key)!.push(m);
    });

    const deptQueues = Array.from(membersByDept.values());
    let deptIdx = 0;

    for (let i = 0; i < teamCount; i++) {
      // 라운드 로빈으로 부서별 배정
      while (deptQueues[deptIdx].length === 0) {
        deptIdx = (deptIdx + 1) % deptQueues.length;
      }
      const member = deptQueues[deptIdx].shift()!;
      teams[i].push(member);
      assignedIds.add(member.id);
      deptIdx = (deptIdx + 1) % deptQueues.length;
    }
  } else {
    // 기타 기준: 순차 배정
    for (let i = 0; i < teamCount; i++) {
      teams[i].push(shuffledMembers[i]);
      assignedIds.add(shuffledMembers[i].id);
    }
  }

  // 2단계: 나머지 멤버들을 적합도 기반으로 배정
  const unassigned = shuffledMembers.filter((m) => !assignedIds.has(m.id));

  for (const member of unassigned) {
    // 아직 자리가 있는 팀 중 가장 적합한 팀 찾기
    let bestTeamIdx = -1;
    let bestScore = -1;

    for (let i = 0; i < teams.length; i++) {
      if (teams[i].length >= teamSize) continue; // 팀이 이미 가득 참

      const fitScore = calculateTeamFitScore(member, teams[i], criteria);
      if (fitScore > bestScore) {
        bestScore = fitScore;
        bestTeamIdx = i;
      }
    }

    if (bestTeamIdx >= 0) {
      teams[bestTeamIdx].push(member);
      assignedIds.add(member.id);
    }
  }

  // 미배정 멤버 (팀 수보다 많은 나머지)
  const ungrouped = shuffledMembers.filter((m) => !assignedIds.has(m.id));

  return { teams, ungrouped };
}

/**
 * 스왑 최적화 (선택적)
 */
function optimizeWithSwaps(
  teams: TeamMember[][],
  criteria: GroupingCriteria,
  maxIterations: number = 100
): TeamMember[][] {
  const optimized = teams.map((t) => [...t]);

  for (let iter = 0; iter < maxIterations; iter++) {
    let improved = false;

    // 모든 팀 쌍에 대해 스왑 검토
    for (let t1 = 0; t1 < optimized.length; t1++) {
      for (let t2 = t1 + 1; t2 < optimized.length; t2++) {
        // 각 멤버 쌍에 대해 스왑 검토
        for (let m1 = 0; m1 < optimized[t1].length; m1++) {
          for (let m2 = 0; m2 < optimized[t2].length; m2++) {
            const currentScore =
              calculateTeamAverageSimilarity(optimized[t1], criteria) +
              calculateTeamAverageSimilarity(optimized[t2], criteria);

            // 스왑
            [optimized[t1][m1], optimized[t2][m2]] = [
              optimized[t2][m2],
              optimized[t1][m1],
            ];

            const newScore =
              calculateTeamAverageSimilarity(optimized[t1], criteria) +
              calculateTeamAverageSimilarity(optimized[t2], criteria);

            if (newScore > currentScore) {
              improved = true; // 스왑 유지
            } else {
              // 스왑 되돌리기
              [optimized[t1][m1], optimized[t2][m2]] = [
                optimized[t2][m2],
                optimized[t1][m1],
              ];
            }
          }
        }
      }
    }

    if (!improved) break; // 더 이상 개선 없으면 종료
  }

  return optimized;
}

/**
 * 메인 팀 생성 함수
 */
export function generateTeams(
  members: TeamMember[],
  teamSize: number,
  criteria: GroupingCriteria,
  options?: {
    optimize?: boolean;
    maxOptimizationIterations?: number;
  }
): { teams: GeneratedTeam[]; ungroupedMembers: TeamMember[] } {
  const { optimize = true, maxOptimizationIterations = 50 } = options || {};

  // 1. Greedy 배정
  let { teams, ungrouped } = greedyTeamAssignment(members, teamSize, criteria);

  // 2. 스왑 최적화 (선택)
  if (optimize && teams.length > 1) {
    teams = optimizeWithSwaps(teams, criteria, maxOptimizationIterations);
  }

  // 3. 미배정 인원을 마지막 조에 추가
  if (ungrouped.length > 0 && teams.length > 0) {
    const lastTeam = teams[teams.length - 1];
    lastTeam.push(...ungrouped);
    ungrouped = []; // 미배정 인원 비우기
  }

  // 4. GeneratedTeam 형식으로 변환
  const generatedTeams: GeneratedTeam[] = teams.map((teamMembers, index) => ({
    teamIndex: index + 1,
    teamName: `${index + 1}조`,
    members: teamMembers,
    diversity: calculateTeamDiversity(teamMembers),
    averageSimilarity: calculateTeamAverageSimilarity(teamMembers, criteria),
  }));

  return {
    teams: generatedTeams,
    ungroupedMembers: ungrouped,
  };
}

/**
 * 전체 조 편성 결과 생성
 */
export function createTeamGroupingResult(
  cohortId: string,
  createdBy: string,
  members: TeamMember[],
  teamSize: number,
  criteriaText: string,
  criteriaParsed: GroupingCriteria
): TeamGroupingResult {
  const { teams, ungroupedMembers } = generateTeams(
    members,
    teamSize,
    criteriaParsed
  );

  return {
    cohortId,
    criteriaText,
    criteriaParsed,
    teamSize,
    teamCount: teams.length,
    teams,
    ungroupedMembers,
    createdBy,
  };
}

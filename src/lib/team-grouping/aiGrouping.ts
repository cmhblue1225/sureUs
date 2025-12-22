/**
 * AI-based Team Grouping
 *
 * Claude AI를 사용하여 전체 조 편성을 수행
 */

import Anthropic from "@anthropic-ai/sdk";
import type { TeamMember, GeneratedTeam, GroupingCriteria } from "./types";

// AI 조 편성 요청
export interface AIGroupingRequest {
  criteriaText: string;
  teamSize: number;
  members: TeamMember[];
}

// AI 조 편성 응답 (Claude가 반환하는 JSON 형식)
interface AIGroupingResponse {
  teams: {
    teamName: string;
    memberIds: string[];
    reasoning: string;
  }[];
  ungroupedMemberIds: string[];
}

const SYSTEM_PROMPT = `당신은 사내 네트워킹 서비스의 조 편성 전문가입니다.
주어진 멤버 정보와 편성 기준을 바탕으로 최적의 팀을 구성해주세요.

중요 규칙:
1. 각 팀은 정확히 지정된 인원수로 구성합니다.
2. 남은 인원(teamSize로 나누어 떨어지지 않는 경우)은 ungroupedMemberIds에 포함합니다.
3. 편성 기준을 최대한 충족하도록 구성합니다.
4. 각 팀에 구성 이유(reasoning)를 간결하게 작성합니다 (한 문장).
5. 반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

/**
 * 멤버 정보를 테이블 형식 문자열로 변환
 */
function formatMembersTable(members: TeamMember[]): string {
  const header = "| ID | 이름 | 부서 | 직급 | 위치 | MBTI | 취미 |";
  const separator = "|---|---|---|---|---|---|---|";

  const rows = members.map((m) => {
    const hobbies = m.hobbies.length > 0 ? m.hobbies.slice(0, 3).join(", ") : "-";
    return `| ${m.id} | ${m.name} | ${m.department || "-"} | ${m.jobRole || "-"} | ${m.officeLocation || "-"} | ${m.mbti || "-"} | ${hobbies} |`;
  });

  return [header, separator, ...rows].join("\n");
}

/**
 * Claude에게 보낼 프롬프트 생성
 */
function buildGroupingPrompt(request: AIGroupingRequest): string {
  const { criteriaText, teamSize, members } = request;
  const teamCount = Math.floor(members.length / teamSize);
  const remainder = members.length % teamSize;

  return `## 편성 기준
${criteriaText}

## 팀 크기
${teamSize}명 (총 ${teamCount}개 팀 구성 예정${remainder > 0 ? `, 나머지 ${remainder}명은 미배정` : ""})

## 멤버 목록 (총 ${members.length}명)
${formatMembersTable(members)}

## 응답 형식
다음 JSON 형식으로 정확히 응답하세요:

{
  "teams": [
    {
      "teamName": "1조",
      "memberIds": ["id1", "id2", "id3", "id4"],
      "reasoning": "같은 AX센터 소속으로 구성"
    },
    {
      "teamName": "2조",
      "memberIds": ["id5", "id6", "id7", "id8"],
      "reasoning": "모두 본사 근무자로 구성"
    }
  ],
  "ungroupedMemberIds": ["id9"]
}

주의사항:
- memberIds에는 위 멤버 목록의 ID를 정확히 사용하세요.
- 각 멤버는 한 팀에만 포함되어야 합니다.
- teamName은 "1조", "2조", "3조" 순서로 작성하세요.
- reasoning은 해당 팀을 왜 이렇게 구성했는지 간결하게 설명하세요.
- JSON만 출력하세요. 다른 텍스트는 포함하지 마세요.`;
}

/**
 * Claude API 응답에서 JSON 추출 및 검증
 */
function parseAIResponse(
  responseText: string,
  members: TeamMember[]
): AIGroupingResponse | null {
  try {
    // JSON 블록 찾기
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as AIGroupingResponse;

    // 기본 구조 검증
    if (!Array.isArray(parsed.teams)) {
      console.error("Invalid teams array in AI response");
      return null;
    }

    // 멤버 ID 유효성 검증
    const validMemberIds = new Set(members.map((m) => m.id));
    const assignedIds = new Set<string>();

    for (const team of parsed.teams) {
      if (!Array.isArray(team.memberIds)) {
        console.error("Invalid memberIds in team:", team.teamName);
        return null;
      }

      for (const id of team.memberIds) {
        if (!validMemberIds.has(id)) {
          console.error("Invalid member ID:", id);
          return null;
        }
        if (assignedIds.has(id)) {
          console.error("Duplicate member ID:", id);
          return null;
        }
        assignedIds.add(id);
      }
    }

    // ungroupedMemberIds 검증
    if (!Array.isArray(parsed.ungroupedMemberIds)) {
      parsed.ungroupedMemberIds = [];
    }

    for (const id of parsed.ungroupedMemberIds) {
      if (!validMemberIds.has(id)) {
        console.error("Invalid ungrouped member ID:", id);
        return null;
      }
      if (assignedIds.has(id)) {
        console.error("Ungrouped member is also assigned:", id);
        return null;
      }
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return null;
  }
}

/**
 * AI 응답을 GeneratedTeam[] 형식으로 변환
 */
function convertToGeneratedTeams(
  aiResponse: AIGroupingResponse,
  members: TeamMember[]
): { teams: GeneratedTeam[]; ungroupedMembers: TeamMember[] } {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const teams: GeneratedTeam[] = aiResponse.teams.map((aiTeam, index) => {
    const teamMembers = aiTeam.memberIds
      .map((id) => memberMap.get(id))
      .filter((m): m is TeamMember => m !== undefined);

    // diversity 계산
    const departments = new Set(teamMembers.map((m) => m.department));
    const mbtis = new Set(teamMembers.map((m) => m.mbti).filter(Boolean));
    const locations = new Set(teamMembers.map((m) => m.officeLocation));

    return {
      teamIndex: index + 1,
      teamName: aiTeam.teamName || `${index + 1}조`,
      members: teamMembers,
      diversity: {
        departmentCount: departments.size,
        mbtiCount: mbtis.size,
        locationCount: locations.size,
      },
      reasoning: aiTeam.reasoning,
    };
  });

  const ungroupedMembers = aiResponse.ungroupedMemberIds
    .map((id) => memberMap.get(id))
    .filter((m): m is TeamMember => m !== undefined);

  return { teams, ungroupedMembers };
}

/**
 * Claude AI를 사용하여 조 편성 수행
 *
 * @throws Error AI 조 편성 실패 시
 */
export async function generateTeamsWithAI(
  request: AIGroupingRequest
): Promise<{ teams: GeneratedTeam[]; ungroupedMembers: TeamMember[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  }

  const client = new Anthropic({ apiKey });
  const prompt = buildGroupingPrompt(request);

  console.log("Calling Claude API for team grouping...");
  console.log("Members count:", request.members.length);
  console.log("Team size:", request.teamSize);
  console.log("Criteria:", request.criteriaText);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    console.log("Claude API response received:", response.id);

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("AI 응답 형식이 올바르지 않습니다.");
    }

    console.log("Response text length:", content.text.length);

    // JSON 파싱 및 검증
    const aiResult = parseAIResponse(content.text, request.members);
    if (!aiResult) {
      throw new Error("AI 응답을 파싱하는데 실패했습니다.");
    }

    // GeneratedTeam[] 형식으로 변환
    const result = convertToGeneratedTeams(aiResult, request.members);

    console.log("Team grouping complete:", result.teams.length, "teams created");

    return result;
  } catch (error) {
    console.error("AI team grouping error:", error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("AI 조 편성 중 오류가 발생했습니다.");
  }
}

/**
 * AI 조 편성 결과를 TeamGroupingResult 형식으로 변환하는 헬퍼
 */
export function createAITeamGroupingResult(
  cohortId: string,
  createdBy: string,
  members: TeamMember[],
  teamSize: number,
  criteriaText: string,
  aiResult: { teams: GeneratedTeam[]; ungroupedMembers: TeamMember[] }
): {
  cohortId: string;
  criteriaText: string;
  criteriaParsed: GroupingCriteria;
  teamSize: number;
  teamCount: number;
  teams: GeneratedTeam[];
  ungroupedMembers: TeamMember[];
  createdBy: string;
} {
  // AI 기반이므로 criteriaParsed는 기본값 사용
  const criteriaParsed: GroupingCriteria = {
    diverseDepartments: false,
    similarDepartments: false,
    similarMbti: false,
    diverseMbti: false,
    sameLocation: false,
    mixedLocations: false,
    mixedJobLevels: false,
    sameJobLevels: false,
    customRules: [criteriaText],
    confidence: 1.0, // AI가 직접 처리했으므로 1.0
  };

  return {
    cohortId,
    criteriaText,
    criteriaParsed,
    teamSize,
    teamCount: aiResult.teams.length,
    teams: aiResult.teams,
    ungroupedMembers: aiResult.ungroupedMembers,
    createdBy,
  };
}

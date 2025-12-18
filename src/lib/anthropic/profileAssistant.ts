/**
 * 프로필 작성 도움 모듈
 * Claude를 사용한 태그 추천 및 텍스트 작성 도움
 */

import { generateText, isAnthropicAvailable } from "./client";

/**
 * 프로필 컨텍스트 (태그 추천 및 텍스트 생성에 사용)
 */
export interface ProfileContext {
  department?: string;
  jobRole?: string;
  officeLocation?: string;
  mbti?: string;
  hobbies?: string[];
  collaborationStyle?: string;
  strengths?: string;
  preferredPeopleType?: string;
  workDescription?: string;
  techStack?: string;
  interests?: string;
  careerGoals?: string;
  education?: string;
}

/**
 * 태그 추천 결과
 */
export interface TagSuggestionResult {
  tags: string[];
  reasoning: string;
}

/**
 * 텍스트 생성 결과
 */
export interface TextGenerationResult {
  suggestion: string;
  alternatives?: string[];
}

/**
 * 취미/관심사 태그 추천
 */
export async function suggestHobbyTags(
  context: ProfileContext,
  existingTags: string[] = [],
  count: number = 5
): Promise<TagSuggestionResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  const prompt = `사용자 프로필 정보를 바탕으로 취미/관심사 태그를 ${count}개 추천해주세요.

프로필 정보:
- 부서: ${context.department || "미입력"}
- 직군: ${context.jobRole || "미입력"}
- MBTI: ${context.mbti || "미입력"}
${context.workDescription ? `- 담당 업무: ${context.workDescription}` : ""}
${context.techStack ? `- 기술 스택: ${context.techStack}` : ""}
${context.interests ? `- 관심 분야: ${context.interests}` : ""}

현재 선택된 태그: ${existingTags.length > 0 ? existingTags.join(", ") : "없음"}

요구사항:
1. 현재 선택된 태그와 중복되지 않는 새로운 태그 추천
2. 직군/업무와 관련있을 수 있는 취미나 관심사 포함
3. 다양한 카테고리(운동, 문화, 음악, 게임, 여행, 음식, 자기계발 등)에서 추천
4. 짧고 명확한 태그 이름 (2-4글자)

JSON 형식으로 응답:
{
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "reasoning": "추천 이유를 한 문장으로"
}`;

  const response = await generateText(prompt, {
    maxTokens: 300,
    temperature: 0.8,
    systemPrompt: "당신은 사내 네트워킹 서비스의 프로필 작성을 돕는 AI입니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    return null;
  }

  try {
    // JSON 추출 (마크다운 코드 블록 처리)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as TagSuggestionResult;
      return {
        tags: parsed.tags.slice(0, count),
        reasoning: parsed.reasoning || "프로필 정보를 바탕으로 추천했습니다.",
      };
    }
  } catch (error) {
    console.error("Tag suggestion parsing error:", error);
  }

  return null;
}

/**
 * 선택된 태그 기반 연관 태그 추천
 */
export async function suggestRelatedTags(
  selectedTags: string[],
  excludeTags: string[] = [],
  count: number = 5
): Promise<TagSuggestionResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  if (selectedTags.length === 0) {
    return null;
  }

  const prompt = `사용자가 선택한 취미/관심사 태그를 바탕으로 관련된 새로운 태그를 ${count}개 추천해주세요.

선택된 태그: ${selectedTags.join(", ")}

제외할 태그 (이미 목록에 있는 태그): ${excludeTags.length > 0 ? excludeTags.join(", ") : "없음"}

요구사항:
1. 선택된 태그와 관련성이 높은 취미/관심사 추천
2. 제외할 태그 목록에 있는 것은 추천하지 않음
3. 비슷한 카테고리의 구체적인 활동 추천 (예: "운동" 선택 시 → "러닝", "헬스", "수영" 등)
4. 짧고 명확한 태그 이름 (1-5글자)
5. 한국어로 작성

JSON 형식으로 응답:
{
  "tags": ["태그1", "태그2", "태그3"],
  "reasoning": "추천 이유를 한 문장으로"
}`;

  const response = await generateText(prompt, {
    maxTokens: 500,
    temperature: 0.8,
    systemPrompt: "당신은 취미와 관심사 추천 전문가입니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    return null;
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as TagSuggestionResult;
      // 제외 태그 필터링
      const filteredTags = parsed.tags
        .filter((tag) => !excludeTags.includes(tag) && !selectedTags.includes(tag))
        .slice(0, count);
      return {
        tags: filteredTags,
        reasoning: parsed.reasoning || "선택한 태그와 관련된 추천입니다.",
      };
    }
  } catch (error) {
    console.error("Related tag suggestion parsing error:", error);
  }

  return null;
}

/**
 * 협업 스타일 작성 도움
 */
export async function generateCollaborationStyle(
  context: ProfileContext
): Promise<TextGenerationResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  const prompt = `사용자가 프로필의 "협업 스타일" 항목을 작성하려고 합니다.
아래 정보를 바탕으로 자연스러운 협업 스타일 소개문을 작성해주세요.

프로필 정보:
- 부서: ${context.department || "미입력"}
- 직군: ${context.jobRole || "미입력"}
- MBTI: ${context.mbti || "미입력"}
${context.workDescription ? `- 담당 업무: ${context.workDescription}` : ""}
${context.techStack ? `- 기술 스택: ${context.techStack}` : ""}

요구사항:
1. 2-3문장으로 작성
2. 구체적인 협업 방식 언급 (커뮤니케이션 선호도, 피드백 스타일 등)
3. 친근하고 자연스러운 톤
4. 1인칭으로 작성

JSON 형식으로 응답:
{
  "suggestion": "작성된 협업 스타일 소개문",
  "alternatives": ["대안 1", "대안 2"]
}`;

  const response = await generateText(prompt, {
    maxTokens: 1000,
    temperature: 0.8,
    systemPrompt: "당신은 프로필 작성을 돕는 AI입니다. 자연스럽고 진정성 있는 자기소개를 작성합니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    console.log("generateCollaborationStyle: No response from API");
    return null;
  }

  console.log("generateCollaborationStyle raw response:", response);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as TextGenerationResult;
      console.log("generateCollaborationStyle parsed:", parsed);
      return parsed;
    }
    console.log("generateCollaborationStyle: No JSON match found");
  } catch (error) {
    console.error("Text generation parsing error:", error);
  }

  return null;
}

/**
 * 강점/장점 작성 도움
 */
export async function generateStrengths(
  context: ProfileContext
): Promise<TextGenerationResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  const prompt = `사용자가 프로필의 "장점/강점" 항목을 작성하려고 합니다.
아래 정보를 바탕으로 자연스러운 강점 소개문을 작성해주세요.

프로필 정보:
- 부서: ${context.department || "미입력"}
- 직군: ${context.jobRole || "미입력"}
- MBTI: ${context.mbti || "미입력"}
${context.workDescription ? `- 담당 업무: ${context.workDescription}` : ""}
${context.techStack ? `- 기술 스택: ${context.techStack}` : ""}
${context.collaborationStyle ? `- 협업 스타일: ${context.collaborationStyle}` : ""}

요구사항:
1. 2-3문장으로 작성
2. 업무적 강점과 소프트 스킬 균형있게 포함
3. 자랑스럽지만 겸손한 톤
4. 1인칭으로 작성

JSON 형식으로 응답:
{
  "suggestion": "작성된 강점 소개문",
  "alternatives": ["대안 1", "대안 2"]
}`;

  const response = await generateText(prompt, {
    maxTokens: 1000,
    temperature: 0.8,
    systemPrompt: "당신은 프로필 작성을 돕는 AI입니다. 자연스럽고 진정성 있는 자기소개를 작성합니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    return null;
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TextGenerationResult;
    }
  } catch (error) {
    console.error("Text generation parsing error:", error);
  }

  return null;
}

/**
 * 선호하는 동료 유형 작성 도움
 */
export async function generatePreferredPeopleType(
  context: ProfileContext
): Promise<TextGenerationResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  const prompt = `사용자가 프로필의 "선호하는 동료 유형" 항목을 작성하려고 합니다.
아래 정보를 바탕으로 자연스러운 선호 동료 유형 소개문을 작성해주세요.

프로필 정보:
- 부서: ${context.department || "미입력"}
- 직군: ${context.jobRole || "미입력"}
- MBTI: ${context.mbti || "미입력"}
${context.collaborationStyle ? `- 협업 스타일: ${context.collaborationStyle}` : ""}
${context.strengths ? `- 본인 강점: ${context.strengths}` : ""}

요구사항:
1. 2-3문장으로 작성
2. 구체적인 성향이나 업무 스타일 언급
3. 긍정적이고 열린 톤
4. 1인칭으로 작성

JSON 형식으로 응답:
{
  "suggestion": "작성된 선호 동료 유형 소개문",
  "alternatives": ["대안 1", "대안 2"]
}`;

  const response = await generateText(prompt, {
    maxTokens: 1000,
    temperature: 0.8,
    systemPrompt: "당신은 프로필 작성을 돕는 AI입니다. 자연스럽고 진정성 있는 자기소개를 작성합니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    return null;
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TextGenerationResult;
    }
  } catch (error) {
    console.error("Text generation parsing error:", error);
  }

  return null;
}

/**
 * 부서에서 하는 일 작성 도움
 */
export async function generateWorkDescription(
  context: ProfileContext
): Promise<TextGenerationResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  const prompt = `사용자가 프로필의 "부서에서 하는 일" 항목을 작성하려고 합니다.
아래 정보를 바탕으로 자연스러운 업무 소개문을 작성해주세요.

프로필 정보:
- 부서: ${context.department || "미입력"}
- 직군: ${context.jobRole || "미입력"}
${context.techStack ? `- 기술 스택: ${context.techStack}` : ""}

요구사항:
1. 2-3문장으로 작성
2. 담당 업무와 역할을 구체적으로 설명
3. 전문 용어는 쉽게 풀어서 설명
4. 1인칭으로 작성

JSON 형식으로 응답:
{
  "suggestion": "작성된 업무 소개문",
  "alternatives": ["대안 1", "대안 2"]
}`;

  const response = await generateText(prompt, {
    maxTokens: 1000,
    temperature: 0.8,
    systemPrompt: "당신은 프로필 작성을 돕는 AI입니다. 자연스럽고 이해하기 쉬운 업무 소개를 작성합니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    console.log("generateWorkDescription: No response from API");
    return null;
  }

  console.log("generateWorkDescription raw response:", response);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as TextGenerationResult;
      console.log("generateWorkDescription parsed:", parsed);
      return parsed;
    }
    console.log("generateWorkDescription: No JSON match found");
  } catch (error) {
    console.error("Text generation parsing error:", error);
  }

  return null;
}

/**
 * 커리어 목표 작성 도움
 */
export async function generateCareerGoals(
  context: ProfileContext
): Promise<TextGenerationResult | null> {
  if (!isAnthropicAvailable()) {
    return null;
  }

  const prompt = `사용자가 프로필의 "커리어 목표" 항목을 작성하려고 합니다.
아래 정보를 바탕으로 자연스러운 커리어 목표 소개문을 작성해주세요.

프로필 정보:
- 부서: ${context.department || "미입력"}
- 직군: ${context.jobRole || "미입력"}
${context.workDescription ? `- 담당 업무: ${context.workDescription}` : ""}
${context.techStack ? `- 기술 스택: ${context.techStack}` : ""}
${context.strengths ? `- 강점: ${context.strengths}` : ""}

요구사항:
1. 2-3문장으로 작성
2. 단기 또는 중장기 목표 포함
3. 성장하려는 방향성 제시
4. 1인칭으로 작성

JSON 형식으로 응답:
{
  "suggestion": "작성된 커리어 목표 소개문",
  "alternatives": ["대안 1", "대안 2"]
}`;

  const response = await generateText(prompt, {
    maxTokens: 1000,
    temperature: 0.8,
    systemPrompt: "당신은 프로필 작성을 돕는 AI입니다. 진정성 있고 영감을 주는 커리어 목표를 작성합니다. JSON 형식으로만 응답합니다.",
  });

  if (!response) {
    return null;
  }

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TextGenerationResult;
    }
  } catch (error) {
    console.error("Text generation parsing error:", error);
  }

  return null;
}

/**
 * 필드 타입별 텍스트 생성
 */
export type ProfileFieldType =
  | "collaborationStyle"
  | "strengths"
  | "preferredPeopleType"
  | "workDescription"
  | "careerGoals";

export async function generateProfileText(
  fieldType: ProfileFieldType,
  context: ProfileContext
): Promise<TextGenerationResult | null> {
  switch (fieldType) {
    case "collaborationStyle":
      return generateCollaborationStyle(context);
    case "strengths":
      return generateStrengths(context);
    case "preferredPeopleType":
      return generatePreferredPeopleType(context);
    case "workDescription":
      return generateWorkDescription(context);
    case "careerGoals":
      return generateCareerGoals(context);
    default:
      return null;
  }
}

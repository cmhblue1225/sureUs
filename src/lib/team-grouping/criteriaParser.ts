/**
 * Team Grouping Criteria Parser
 *
 * Claude AI를 사용하여 자연어 조 편성 기준을 구조화된 형식으로 변환
 */

import { generateText, isAnthropicAvailable } from "@/lib/anthropic/client";
import { GroupingCriteria, DEFAULT_GROUPING_CRITERIA } from "./types";

const CRITERIA_PARSING_SYSTEM_PROMPT = `당신은 사내 네트워킹 서비스의 조 편성 어시스턴트입니다.
관리자가 입력한 자연어 조 편성 기준을 분석하여 구조화된 형식으로 변환합니다.

중요 규칙:
1. 서로 상반되는 기준이 입력되면 마지막에 언급된 기준을 우선합니다.
   예: "부서 다양하게, 같은 부서끼리" → diverseDepartments: false, similarDepartments: true
2. 명시되지 않은 기준은 false로 설정합니다.
3. 반드시 유효한 JSON 형식으로만 응답하세요.`;

/**
 * Claude에게 보낼 프롬프트 생성
 */
function buildCriteriaPrompt(criteriaText: string): string {
  return `관리자가 다음과 같이 조 편성 기준을 입력했습니다:
"${criteriaText}"

다음 JSON 형식으로 기준을 분석해주세요:

{
  "diverseDepartments": true/false,    // 부서 다양하게 섞기
  "similarDepartments": true/false,    // 같은 부서끼리 묶기
  "similarMbti": true/false,           // MBTI 궁합 좋게/비슷하게
  "diverseMbti": true/false,           // MBTI 다양하게
  "sameLocation": true/false,          // 같은 지역끼리
  "mixedLocations": true/false,        // 지역 다양하게
  "mixedJobLevels": true/false,        // 직급 다양하게 (멘토-멘티)
  "sameJobLevels": true/false,         // 같은 직급끼리
  "customRules": [],                   // 위에 해당하지 않는 추가 규칙 (문자열 배열)
  "confidence": 0.0-1.0                // 해석 신뢰도
}

키워드 매핑 예시:
- "부서 다양하게", "여러 부서", "다양한 부서에서", "부서 섞어서" → diverseDepartments: true
- "같은 부서", "부서별로", "같은 팀끼리", "부서 맞춰서" → similarDepartments: true
- "MBTI 비슷한", "성향 맞는", "성격 비슷한", "MBTI 궁합", "궁합 좋게" → similarMbti: true
- "MBTI 다양하게", "성격 다양하게", "외향 내향 섞어서" → diverseMbti: true
- "같은 지역", "가까운 사람끼리", "지역 맞춰서", "본사끼리" → sameLocation: true
- "지역 다양하게", "여러 지역", "본사 청도 섞어서" → mixedLocations: true
- "직급 섞어서", "시니어 주니어", "멘토 멘티", "경력자와 신입" → mixedJobLevels: true
- "동기끼리", "비슷한 연차", "같은 직급" → sameJobLevels: true
- "랜덤", "무작위", "아무렇게나" → 모든 기준 false, confidence: 0.9

JSON만 출력하세요. 설명이나 다른 텍스트는 포함하지 마세요.`;
}

/**
 * 규칙 기반 폴백 파싱 (Claude 사용 불가 시)
 */
function parseWithRules(criteriaText: string): GroupingCriteria {
  const text = criteriaText.toLowerCase();
  const criteria: GroupingCriteria = { ...DEFAULT_GROUPING_CRITERIA };

  // 부서 관련
  if (/부서.*(다양|섞|여러|다른)/.test(text) || /다양.*(부서)/.test(text)) {
    criteria.diverseDepartments = true;
  }
  if (/부서.*(같|맞춰|별로)/.test(text) || /같은.*(부서|팀)/.test(text)) {
    criteria.similarDepartments = true;
    criteria.diverseDepartments = false; // 상반 기준 처리
  }

  // MBTI 관련
  if (/mbti.*(비슷|맞|궁합|좋)/.test(text) || /성향.*(비슷|맞)/.test(text) || /성격.*(비슷|맞)/.test(text)) {
    criteria.similarMbti = true;
  }
  if (/mbti.*(다양|골고루|섞)/.test(text) || /성격.*(다양)/.test(text) || /외향.*(내향|섞)/.test(text)) {
    criteria.diverseMbti = true;
    criteria.similarMbti = false; // 상반 기준 처리
  }

  // 지역 관련
  if (/지역.*(같|가까|맞춰)/.test(text) || /같은.*(지역|사무실|오피스)/.test(text) || /본사끼리/.test(text)) {
    criteria.sameLocation = true;
  }
  if (/지역.*(다양|섞|여러)/.test(text) || /본사.*(청도|섞)/.test(text)) {
    criteria.mixedLocations = true;
    criteria.sameLocation = false;
  }

  // 직급 관련
  if (/직급.*(섞|다양|다른)/.test(text) || /시니어.*(주니어)/.test(text) || /멘토|멘티/.test(text) || /경력.*(신입)/.test(text)) {
    criteria.mixedJobLevels = true;
  }
  if (/직급.*(같|동기|비슷)/.test(text) || /동기끼리/.test(text) || /같은.*(직급|연차)/.test(text)) {
    criteria.sameJobLevels = true;
    criteria.mixedJobLevels = false;
  }

  // 랜덤/무작위
  if (/랜덤|무작위|아무렇게나/.test(text)) {
    criteria.confidence = 0.9;
    return criteria; // 모든 기준 false 유지
  }

  // confidence 계산 (매칭된 기준 수에 따라)
  const matchedCount = [
    criteria.diverseDepartments,
    criteria.similarDepartments,
    criteria.similarMbti,
    criteria.diverseMbti,
    criteria.sameLocation,
    criteria.mixedLocations,
    criteria.mixedJobLevels,
    criteria.sameJobLevels,
  ].filter(Boolean).length;

  criteria.confidence = matchedCount > 0 ? 0.6 + (matchedCount * 0.05) : 0.3;

  return criteria;
}

/**
 * Claude API 응답에서 JSON 추출
 */
function extractJsonFromResponse(text: string): GroupingCriteria | null {
  try {
    // JSON 블록 찾기
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // 필수 필드 검증 및 기본값 적용
    return {
      diverseDepartments: Boolean(parsed.diverseDepartments),
      similarDepartments: Boolean(parsed.similarDepartments),
      similarMbti: Boolean(parsed.similarMbti),
      diverseMbti: Boolean(parsed.diverseMbti),
      sameLocation: Boolean(parsed.sameLocation),
      mixedLocations: Boolean(parsed.mixedLocations),
      mixedJobLevels: Boolean(parsed.mixedJobLevels),
      sameJobLevels: Boolean(parsed.sameJobLevels),
      customRules: Array.isArray(parsed.customRules) ? parsed.customRules : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
    };
  } catch (error) {
    console.error("Failed to parse criteria JSON:", error);
    return null;
  }
}

/**
 * 자연어 조 편성 기준을 구조화된 형식으로 파싱
 */
export async function parseGroupingCriteria(
  criteriaText: string
): Promise<GroupingCriteria> {
  // 입력이 비어있으면 기본값 반환
  if (!criteriaText.trim()) {
    return {
      ...DEFAULT_GROUPING_CRITERIA,
      confidence: 0,
    };
  }

  // Claude API 사용 가능 여부 확인
  if (!isAnthropicAvailable()) {
    console.log("Anthropic API not available, using rule-based parsing");
    return parseWithRules(criteriaText);
  }

  try {
    const prompt = buildCriteriaPrompt(criteriaText);
    const response = await generateText(prompt, {
      maxTokens: 500,
      temperature: 0.3, // 낮은 temperature로 일관성 확보
      systemPrompt: CRITERIA_PARSING_SYSTEM_PROMPT,
    });

    if (!response) {
      console.log("No response from Claude, using rule-based parsing");
      return parseWithRules(criteriaText);
    }

    const parsed = extractJsonFromResponse(response);
    if (!parsed) {
      console.log("Failed to extract JSON, using rule-based parsing");
      return parseWithRules(criteriaText);
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing criteria with Claude:", error);
    return parseWithRules(criteriaText);
  }
}

/**
 * 파싱된 기준을 사람이 읽기 쉬운 형태로 변환
 */
export function criteriaToKorean(criteria: GroupingCriteria): string[] {
  const descriptions: string[] = [];

  if (criteria.diverseDepartments) {
    descriptions.push("부서 다양하게 구성");
  }
  if (criteria.similarDepartments) {
    descriptions.push("같은 부서끼리 구성");
  }
  if (criteria.similarMbti) {
    descriptions.push("MBTI 궁합 맞춰서 구성");
  }
  if (criteria.diverseMbti) {
    descriptions.push("MBTI 다양하게 구성");
  }
  if (criteria.sameLocation) {
    descriptions.push("같은 지역끼리 구성");
  }
  if (criteria.mixedLocations) {
    descriptions.push("지역 다양하게 구성");
  }
  if (criteria.mixedJobLevels) {
    descriptions.push("직급 다양하게 (멘토-멘티)");
  }
  if (criteria.sameJobLevels) {
    descriptions.push("같은 직급끼리 구성");
  }

  if (criteria.customRules.length > 0) {
    descriptions.push(...criteria.customRules);
  }

  if (descriptions.length === 0) {
    descriptions.push("무작위 배정");
  }

  return descriptions;
}

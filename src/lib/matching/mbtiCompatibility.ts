/**
 * MBTI Compatibility Matrix
 * Based on cognitive function theory and temperament groups
 *
 * Compatibility Tiers:
 * - 1.0: Ideal (share cognitive functions, complementary)
 * - 0.85: Great (same temperament group)
 * - 0.70: Good (complementary types)
 * - 0.55: Neutral
 * - 0.40: Challenging (opposite on most axes)
 */

// MBTI Temperament Groups
const NT_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP"]; // Analysts
const NF_TYPES = ["INFJ", "INFP", "ENFJ", "ENFP"]; // Diplomats
const SJ_TYPES = ["ISTJ", "ISFJ", "ESTJ", "ESFJ"]; // Sentinels
const SP_TYPES = ["ISTP", "ISFP", "ESTP", "ESFP"]; // Explorers

// Pre-computed compatibility matrix (16x16 = 256 pairs)
// Based on cognitive function compatibility and research-based pairings
const MBTI_COMPATIBILITY_MATRIX: Record<string, Record<string, number>> = {
  // INTJ - Ni Te Fi Se
  INTJ: {
    INTJ: 0.80, INTP: 0.85, ENTJ: 0.90, ENTP: 1.00,
    INFJ: 0.75, INFP: 0.70, ENFJ: 0.65, ENFP: 0.85,
    ISTJ: 0.60, ISFJ: 0.50, ESTJ: 0.55, ESFJ: 0.45,
    ISTP: 0.65, ISFP: 0.55, ESTP: 0.60, ESFP: 0.50,
  },
  // INTP - Ti Ne Si Fe
  INTP: {
    INTJ: 0.85, INTP: 0.75, ENTJ: 0.90, ENTP: 0.85,
    INFJ: 0.80, INFP: 0.70, ENFJ: 0.75, ENFP: 0.80,
    ISTJ: 0.60, ISFJ: 0.50, ESTJ: 0.55, ESFJ: 0.55,
    ISTP: 0.70, ISFP: 0.55, ESTP: 0.65, ESFP: 0.50,
  },
  // ENTJ - Te Ni Se Fi
  ENTJ: {
    INTJ: 0.90, INTP: 0.90, ENTJ: 0.80, ENTP: 0.85,
    INFJ: 0.75, INFP: 0.80, ENFJ: 0.70, ENFP: 0.75,
    ISTJ: 0.65, ISFJ: 0.55, ESTJ: 0.70, ESFJ: 0.55,
    ISTP: 0.75, ISFP: 0.60, ESTP: 0.70, ESFP: 0.55,
  },
  // ENTP - Ne Ti Fe Si
  ENTP: {
    INTJ: 1.00, INTP: 0.85, ENTJ: 0.85, ENTP: 0.75,
    INFJ: 0.95, INFP: 0.80, ENFJ: 0.80, ENFP: 0.75,
    ISTJ: 0.55, ISFJ: 0.50, ESTJ: 0.60, ESFJ: 0.55,
    ISTP: 0.70, ISFP: 0.55, ESTP: 0.65, ESFP: 0.55,
  },
  // INFJ - Ni Fe Ti Se
  INFJ: {
    INTJ: 0.75, INTP: 0.80, ENTJ: 0.75, ENTP: 0.95,
    INFJ: 0.80, INFP: 0.85, ENFJ: 0.85, ENFP: 1.00,
    ISTJ: 0.55, ISFJ: 0.60, ESTJ: 0.50, ESFJ: 0.60,
    ISTP: 0.60, ISFP: 0.65, ESTP: 0.55, ESFP: 0.55,
  },
  // INFP - Fi Ne Si Te
  INFP: {
    INTJ: 0.70, INTP: 0.70, ENTJ: 0.80, ENTP: 0.80,
    INFJ: 0.85, INFP: 0.75, ENFJ: 0.90, ENFP: 0.85,
    ISTJ: 0.55, ISFJ: 0.60, ESTJ: 0.55, ESFJ: 0.60,
    ISTP: 0.55, ISFP: 0.70, ESTP: 0.50, ESFP: 0.60,
  },
  // ENFJ - Fe Ni Se Ti
  ENFJ: {
    INTJ: 0.65, INTP: 0.75, ENTJ: 0.70, ENTP: 0.80,
    INFJ: 0.85, INFP: 0.90, ENFJ: 0.80, ENFP: 0.85,
    ISTJ: 0.55, ISFJ: 0.65, ESTJ: 0.55, ESFJ: 0.70,
    ISTP: 0.60, ISFP: 0.75, ESTP: 0.60, ESFP: 0.70,
  },
  // ENFP - Ne Fi Te Si
  ENFP: {
    INTJ: 0.85, INTP: 0.80, ENTJ: 0.75, ENTP: 0.75,
    INFJ: 1.00, INFP: 0.85, ENFJ: 0.85, ENFP: 0.75,
    ISTJ: 0.55, ISFJ: 0.55, ESTJ: 0.55, ESFJ: 0.60,
    ISTP: 0.60, ISFP: 0.70, ESTP: 0.60, ESFP: 0.65,
  },
  // ISTJ - Si Te Fi Ne
  ISTJ: {
    INTJ: 0.60, INTP: 0.60, ENTJ: 0.65, ENTP: 0.55,
    INFJ: 0.55, INFP: 0.55, ENFJ: 0.55, ENFP: 0.55,
    ISTJ: 0.80, ISFJ: 0.85, ESTJ: 0.90, ESFJ: 0.85,
    ISTP: 0.75, ISFP: 0.70, ESTP: 0.80, ESFP: 0.70,
  },
  // ISFJ - Si Fe Ti Ne
  ISFJ: {
    INTJ: 0.50, INTP: 0.50, ENTJ: 0.55, ENTP: 0.50,
    INFJ: 0.60, INFP: 0.60, ENFJ: 0.65, ENFP: 0.55,
    ISTJ: 0.85, ISFJ: 0.80, ESTJ: 0.85, ESFJ: 0.90,
    ISTP: 0.70, ISFP: 0.80, ESTP: 0.75, ESFP: 0.85,
  },
  // ESTJ - Te Si Ne Fi
  ESTJ: {
    INTJ: 0.55, INTP: 0.55, ENTJ: 0.70, ENTP: 0.60,
    INFJ: 0.50, INFP: 0.55, ENFJ: 0.55, ENFP: 0.55,
    ISTJ: 0.90, ISFJ: 0.85, ESTJ: 0.80, ESFJ: 0.85,
    ISTP: 0.80, ISFP: 0.70, ESTP: 0.85, ESFP: 0.75,
  },
  // ESFJ - Fe Si Ne Ti
  ESFJ: {
    INTJ: 0.45, INTP: 0.55, ENTJ: 0.55, ENTP: 0.55,
    INFJ: 0.60, INFP: 0.60, ENFJ: 0.70, ENFP: 0.60,
    ISTJ: 0.85, ISFJ: 0.90, ESTJ: 0.85, ESFJ: 0.80,
    ISTP: 0.70, ISFP: 0.85, ESTP: 0.80, ESFP: 0.90,
  },
  // ISTP - Ti Se Ni Fe
  ISTP: {
    INTJ: 0.65, INTP: 0.70, ENTJ: 0.75, ENTP: 0.70,
    INFJ: 0.60, INFP: 0.55, ENFJ: 0.60, ENFP: 0.60,
    ISTJ: 0.75, ISFJ: 0.70, ESTJ: 0.80, ESFJ: 0.70,
    ISTP: 0.80, ISFP: 0.85, ESTP: 0.90, ESFP: 0.85,
  },
  // ISFP - Fi Se Ni Te
  ISFP: {
    INTJ: 0.55, INTP: 0.55, ENTJ: 0.60, ENTP: 0.55,
    INFJ: 0.65, INFP: 0.70, ENFJ: 0.75, ENFP: 0.70,
    ISTJ: 0.70, ISFJ: 0.80, ESTJ: 0.70, ESFJ: 0.85,
    ISTP: 0.85, ISFP: 0.80, ESTP: 0.90, ESFP: 0.90,
  },
  // ESTP - Se Ti Fe Ni
  ESTP: {
    INTJ: 0.60, INTP: 0.65, ENTJ: 0.70, ENTP: 0.65,
    INFJ: 0.55, INFP: 0.50, ENFJ: 0.60, ENFP: 0.60,
    ISTJ: 0.80, ISFJ: 0.75, ESTJ: 0.85, ESFJ: 0.80,
    ISTP: 0.90, ISFP: 0.90, ESTP: 0.80, ESFP: 0.90,
  },
  // ESFP - Se Fi Te Ni
  ESFP: {
    INTJ: 0.50, INTP: 0.50, ENTJ: 0.55, ENTP: 0.55,
    INFJ: 0.55, INFP: 0.60, ENFJ: 0.70, ENFP: 0.65,
    ISTJ: 0.70, ISFJ: 0.85, ESTJ: 0.75, ESFJ: 0.90,
    ISTP: 0.85, ISFP: 0.90, ESTP: 0.90, ESFP: 0.80,
  },
};

/**
 * Get MBTI compatibility score between two types
 * @param type1 First MBTI type
 * @param type2 Second MBTI type
 * @returns Compatibility score (0-1), 0.5 if either type is missing
 */
export function getMbtiCompatibility(
  type1: string | null | undefined,
  type2: string | null | undefined
): number {
  // If either type is missing, return neutral score
  if (!type1 || !type2) {
    return 0.5;
  }

  const normalizedType1 = type1.toUpperCase();
  const normalizedType2 = type2.toUpperCase();

  // Check if types are valid
  if (!MBTI_COMPATIBILITY_MATRIX[normalizedType1]) {
    return 0.5;
  }

  const score = MBTI_COMPATIBILITY_MATRIX[normalizedType1][normalizedType2];
  return score ?? 0.5;
}

/**
 * Get temperament group for an MBTI type
 */
export function getTemperamentGroup(mbtiType: string): string | null {
  const normalized = mbtiType.toUpperCase();

  if (NT_TYPES.includes(normalized)) return "NT";
  if (NF_TYPES.includes(normalized)) return "NF";
  if (SJ_TYPES.includes(normalized)) return "SJ";
  if (SP_TYPES.includes(normalized)) return "SP";

  return null;
}

/**
 * Check if two MBTI types are in the same temperament group
 */
export function isSameTemperament(
  type1: string | null | undefined,
  type2: string | null | undefined
): boolean {
  if (!type1 || !type2) return false;

  const group1 = getTemperamentGroup(type1);
  const group2 = getTemperamentGroup(type2);

  return group1 !== null && group1 === group2;
}

/**
 * Get a human-readable compatibility description
 */
export function getMbtiCompatibilityDescription(
  type1: string | null | undefined,
  type2: string | null | undefined
): string {
  if (!type1 || !type2) {
    return "MBTI 정보가 없습니다";
  }

  const score = getMbtiCompatibility(type1, type2);

  if (score >= 0.90) {
    return "매우 높은 궁합";
  } else if (score >= 0.75) {
    return "높은 궁합";
  } else if (score >= 0.60) {
    return "좋은 궁합";
  } else if (score >= 0.50) {
    return "보통 궁합";
  } else {
    return "도전적인 궁합";
  }
}

/**
 * Get temperament group name in Korean
 */
export function getTemperamentGroupName(mbtiType: string): string {
  const group = getTemperamentGroup(mbtiType);

  switch (group) {
    case "NT": return "분석가";
    case "NF": return "외교관";
    case "SJ": return "관리자";
    case "SP": return "탐험가";
    default: return "";
  }
}

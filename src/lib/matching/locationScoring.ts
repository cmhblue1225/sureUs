/**
 * Location Proximity Scoring System
 * Considers physical proximity for in-person collaboration potential
 *
 * Scoring Tiers:
 * - 1.0: Same location (same office)
 * - 0.7: Same city area (e.g., 서울 본사/강남/판교)
 * - 0.5: Remote-friendly (at least one is 재택근무)
 * - 0.3: Different cities
 */

// Location groups - locations in the same area
const SEOUL_LOCATIONS = ["서울 본사", "서울 강남", "서울 판교"];
const METRO_CITIES = ["부산", "대구", "인천", "광주", "대전"];

/**
 * Calculate location score between two locations
 * @param loc1 First location
 * @param loc2 Second location
 * @returns Score (0-1)
 */
export function calculateLocationScore(
  loc1: string | null | undefined,
  loc2: string | null | undefined
): number {
  if (!loc1 || !loc2) {
    return 0.5; // Neutral if missing
  }

  // Same location - highest score
  if (loc1 === loc2) {
    return 1.0;
  }

  // Check if one is remote (재택근무) - still good for collaboration
  if (loc1 === "재택근무" || loc2 === "재택근무") {
    return 0.5;
  }

  // Check if one is overseas (해외)
  if (loc1 === "해외" || loc2 === "해외") {
    return 0.3;
  }

  // Check if both are in Seoul area
  if (SEOUL_LOCATIONS.includes(loc1) && SEOUL_LOCATIONS.includes(loc2)) {
    return 0.7;
  }

  // Check if both are in metro cities (different cities but accessible)
  if (METRO_CITIES.includes(loc1) && METRO_CITIES.includes(loc2)) {
    return 0.4;
  }

  // One Seoul, one metro city
  if (
    (SEOUL_LOCATIONS.includes(loc1) && METRO_CITIES.includes(loc2)) ||
    (SEOUL_LOCATIONS.includes(loc2) && METRO_CITIES.includes(loc1))
  ) {
    return 0.4;
  }

  // 제주 is more isolated
  if (loc1 === "제주" || loc2 === "제주") {
    // 제주-제주 is already handled by same location
    return 0.3;
  }

  // Other cases (기타 or unrecognized)
  return 0.3;
}

/**
 * Get location proximity description
 */
export function getLocationProximityDescription(
  loc1: string | null | undefined,
  loc2: string | null | undefined
): string {
  if (!loc1 || !loc2) {
    return "위치 정보 없음";
  }

  if (loc1 === loc2) {
    return "같은 사무실";
  }

  if (loc1 === "재택근무" || loc2 === "재택근무") {
    return "재택 근무 호환";
  }

  if (SEOUL_LOCATIONS.includes(loc1) && SEOUL_LOCATIONS.includes(loc2)) {
    return "서울권";
  }

  if (loc1 === "해외" || loc2 === "해외") {
    return "해외";
  }

  if (loc1 === "제주" || loc2 === "제주") {
    return "제주";
  }

  return "다른 도시";
}

/**
 * Check if two locations are in the same city area
 */
export function isSameCityArea(
  loc1: string | null | undefined,
  loc2: string | null | undefined
): boolean {
  if (!loc1 || !loc2) return false;

  if (loc1 === loc2) return true;

  // Seoul area check
  if (SEOUL_LOCATIONS.includes(loc1) && SEOUL_LOCATIONS.includes(loc2)) {
    return true;
  }

  return false;
}

/**
 * Check if location is remote-friendly
 */
export function isRemoteFriendly(loc: string | null | undefined): boolean {
  return loc === "재택근무";
}

/**
 * Get location group name
 */
export function getLocationGroup(loc: string): string {
  if (SEOUL_LOCATIONS.includes(loc)) return "서울권";
  if (METRO_CITIES.includes(loc)) return "광역시";
  if (loc === "제주") return "제주";
  if (loc === "해외") return "해외";
  if (loc === "재택근무") return "재택";
  return "기타";
}

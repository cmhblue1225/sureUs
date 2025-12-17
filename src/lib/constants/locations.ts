/**
 * 근무지 상수
 * 조직도 기반 업데이트
 */

export const OFFICE_LOCATIONS = [
  "본사",        // 한국 본사 (판교)
  "청도",        // 중국 청도 (청도슈어)
  "재택근무",    // 원격 근무
  "기타",        // 기타 지역
] as const;

export type OfficeLocation = (typeof OFFICE_LOCATIONS)[number];

// 근무지 설명 (표시용)
export const OFFICE_LOCATION_DESCRIPTIONS: Record<OfficeLocation, string> = {
  "본사": "판교 본사",
  "청도": "중국 청도 (청도슈어)",
  "재택근무": "원격 근무",
  "기타": "기타 지역",
};

// 이전 근무지 값 매핑 (기존 데이터 호환용)
export const LEGACY_LOCATION_MAPPING: Record<string, OfficeLocation> = {
  "서울 본사": "본사",
  "서울 강남": "본사",
  "서울 판교": "본사",
  "부산": "기타",
  "대구": "기타",
  "인천": "기타",
  "광주": "기타",
  "대전": "기타",
  "제주": "기타",
  "해외": "청도",
};

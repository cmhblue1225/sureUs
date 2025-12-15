export const OFFICE_LOCATIONS = [
  "서울 본사",
  "서울 강남",
  "서울 판교",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "제주",
  "재택근무",
  "해외",
  "기타",
] as const;

export type OfficeLocation = (typeof OFFICE_LOCATIONS)[number];

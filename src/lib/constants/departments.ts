export const DEPARTMENTS = [
  "개발팀",
  "디자인팀",
  "기획팀",
  "마케팅팀",
  "영업팀",
  "인사팀",
  "재무팀",
  "운영팀",
  "고객지원팀",
  "QA팀",
  "데이터팀",
  "보안팀",
  "인프라팀",
  "경영지원팀",
  "기타",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

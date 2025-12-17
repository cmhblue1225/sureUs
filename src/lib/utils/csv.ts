/**
 * CSV 파싱 및 생성 유틸리티
 */

import type { NewEmployeeData, CSVParseResult } from "@/types/employee";

const COMPANY_EMAIL_DOMAIN = "@suresofttech.com";

// CSV 헤더 매핑
const CSV_HEADERS = {
  이름: "name",
  이메일: "email",
  부서: "orgLevel1",
  실: "orgLevel2",
  팀: "orgLevel3",
  전화번호: "phoneNumber",
  생년월일: "birthdate",
  주소: "address",
  성별: "gender",
} as const;

const GENDER_MAP: Record<string, "male" | "female" | "other"> = {
  male: "male",
  female: "female",
  other: "other",
  남: "male",
  여: "female",
  남성: "male",
  여성: "female",
  남자: "male",
  여자: "female",
};

/**
 * 회사 이메일 도메인 검증
 */
export function validateCompanyEmail(email: string): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(COMPANY_EMAIL_DOMAIN);
}

/**
 * 전화번호 포맷팅
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, "");
  // 010-XXXX-XXXX 형식으로 변환
  if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  }
  return phone;
}

/**
 * 생년월일 포맷 검증 및 정규화
 */
export function normalizeBirthdate(birthdate: string): string | null {
  if (!birthdate) return null;

  // YYYY-MM-DD 형식인지 확인
  const isoMatch = birthdate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return birthdate;
  }

  // YYYYMMDD 형식
  const numericMatch = birthdate.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (numericMatch) {
    return `${numericMatch[1]}-${numericMatch[2]}-${numericMatch[3]}`;
  }

  // YYYY/MM/DD 형식
  const slashMatch = birthdate.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
  }

  return null;
}

/**
 * CSV 문자열 파싱
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * CSV 파일 내용 파싱
 */
export function parseEmployeeCSV(content: string): CSVParseResult {
  const errors: CSVParseResult["errors"] = [];
  const data: NewEmployeeData[] = [];

  // BOM 제거
  const cleanContent = content.replace(/^\uFEFF/, "");

  // 줄 단위로 분리
  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return {
      valid: false,
      data: [],
      errors: [{ row: 0, field: "", message: "CSV 파일에 데이터가 없습니다." }],
    };
  }

  // 헤더 파싱
  const headers = parseCSVLine(lines[0]);
  const headerMap = new Map<number, keyof NewEmployeeData>();

  headers.forEach((header, index) => {
    const mappedKey = CSV_HEADERS[header as keyof typeof CSV_HEADERS];
    if (mappedKey) {
      headerMap.set(index, mappedKey as keyof NewEmployeeData);
    }
  });

  // 필수 헤더 확인
  const requiredHeaders = ["이름", "이메일", "부서", "전화번호"];
  const missingHeaders = requiredHeaders.filter(
    (h) => !headers.includes(h)
  );

  if (missingHeaders.length > 0) {
    return {
      valid: false,
      data: [],
      errors: [
        {
          row: 0,
          field: "",
          message: `필수 헤더가 누락되었습니다: ${missingHeaders.join(", ")}`,
        },
      ],
    };
  }

  // 데이터 행 파싱
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowNum = i + 1;

    // 빈 행 스킵
    if (values.every((v) => !v)) continue;

    const employee: Partial<NewEmployeeData> = {};

    headerMap.forEach((field, index) => {
      const value = values[index]?.trim() || "";

      if (field === "gender" && value) {
        const normalizedGender = GENDER_MAP[value.toLowerCase()];
        if (normalizedGender) {
          employee[field] = normalizedGender;
        }
      } else if (field === "birthdate" && value) {
        const normalized = normalizeBirthdate(value);
        if (normalized) {
          employee[field] = normalized;
        } else if (value) {
          errors.push({
            row: rowNum,
            field: "생년월일",
            message: `잘못된 생년월일 형식입니다: ${value}`,
          });
        }
      } else if (field === "phoneNumber" && value) {
        employee[field] = formatPhoneNumber(value);
      } else if (value) {
        (employee as Record<string, string>)[field] = value;
      }
    });

    // 필수 필드 검증
    if (!employee.name) {
      errors.push({ row: rowNum, field: "이름", message: "이름은 필수입니다." });
    }

    if (!employee.email) {
      errors.push({ row: rowNum, field: "이메일", message: "이메일은 필수입니다." });
    } else if (!validateCompanyEmail(employee.email)) {
      errors.push({
        row: rowNum,
        field: "이메일",
        message: `이메일은 ${COMPANY_EMAIL_DOMAIN} 도메인이어야 합니다.`,
      });
    }

    if (!employee.orgLevel1) {
      errors.push({ row: rowNum, field: "부서", message: "부서는 필수입니다." });
    }

    if (!employee.phoneNumber) {
      errors.push({ row: rowNum, field: "전화번호", message: "전화번호는 필수입니다." });
    }

    // 필수 필드가 있으면 데이터에 추가
    if (employee.name && employee.email && employee.orgLevel1 && employee.phoneNumber) {
      data.push(employee as NewEmployeeData);
    }
  }

  return {
    valid: errors.length === 0,
    data,
    errors,
  };
}

/**
 * CSV 템플릿 생성
 */
export function generateCSVTemplate(): string {
  const headers = Object.keys(CSV_HEADERS).join(",");
  const exampleRow1 = [
    "홍길동",
    "hong@suresofttech.com",
    "시험자동화연구소",
    "Cloud실",
    "Frontend팀",
    "010-1234-5678",
    "1995-03-15",
    "서울시 강남구",
    "male",
  ].join(",");
  const exampleRow2 = [
    "김철수",
    "kim@suresofttech.com",
    "임베디드기술연구소",
    "",
    "",
    "010-9876-5432",
    "1990-07-20",
    "",
    "male",
  ].join(",");

  return `${headers}\n${exampleRow1}\n${exampleRow2}`;
}

/**
 * 생년월일로 초기 비밀번호 생성
 */
export function generateInitialPassword(birthdate?: string): string {
  if (birthdate) {
    // YYYY-MM-DD → YYYYMMDD
    return birthdate.replace(/-/g, "");
  }
  // 기본값: sure + 현재 연도
  return `sure${new Date().getFullYear()}`;
}

/**
 * 신입사원 관리 타입 정의
 */

export interface NewEmployeeData {
  name: string;               // 이름 (필수)
  email: string;              // 이메일 (필수, @suresofttech.com)
  orgLevel1: string;          // 부서 (필수)
  orgLevel2?: string;         // 실 (선택)
  orgLevel3?: string;         // 팀 (선택)
  phoneNumber: string;        // 전화번호 (필수)
  birthdate?: string;         // 생년월일 (YYYY-MM-DD)
  address?: string;           // 주소 (선택)
  gender?: "male" | "female" | "other";  // 성별 (선택)
  employeeId?: string;        // 사번 (선택, 없으면 자동 생성)
}

export interface EmployeeRegistrationResult {
  success: boolean;
  employeeId?: string;        // 자동 생성된 사번
  email?: string;
  name?: string;
  error?: string;
}

export interface BulkRegistrationResult {
  total: number;
  successful: number;
  failed: number;
  results: EmployeeRegistrationResult[];
}

export interface CSVParseResult {
  valid: boolean;
  data: NewEmployeeData[];
  errors: Array<{ row: number; field: string; message: string }>;
}

export interface EmployeeListItem {
  id: string;
  employeeId: string;         // 사번
  name: string;
  email: string;
  orgLevel1: string;
  orgLevel2?: string;
  orgLevel3?: string;
  phoneNumber?: string;
  birthdate?: string;
  gender?: string;
  createdAt: string;
}

export interface EmployeeListResponse {
  employees: EmployeeListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

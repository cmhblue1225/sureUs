"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ORG_LEVEL1_OPTIONS,
  getOrgLevel2Options,
  getOrgLevel3Options,
  hasLevel2,
  hasLevel3,
} from "@/lib/constants/organization";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { NewEmployeeData, BulkRegistrationResult } from "@/types/employee";

const COMPANY_EMAIL_DOMAIN = "@suresofttech.com";
const MAX_EMPLOYEES = 30;

interface EmployeeRow extends NewEmployeeData {
  id: string;
  autoGenerateId: boolean;  // 사번 자동 생성 여부
}

interface EmployeeRegistrationFormProps {
  onSuccess?: () => void;
}

export function EmployeeRegistrationForm({
  onSuccess,
}: EmployeeRegistrationFormProps) {
  const [employees, setEmployees] = useState<EmployeeRow[]>([
    createEmptyEmployee(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BulkRegistrationResult | null>(null);

  function createEmptyEmployee(): EmployeeRow {
    return {
      id: crypto.randomUUID(),
      name: "",
      email: "",
      orgLevel1: "",
      orgLevel2: "",
      orgLevel3: "",
      phoneNumber: "",
      birthdate: "",
      address: "",
      gender: undefined,
      employeeId: "",
      autoGenerateId: true,  // 기본값: 자동 생성
    };
  }

  function addEmployee() {
    if (employees.length < MAX_EMPLOYEES) {
      setEmployees([...employees, createEmptyEmployee()]);
    }
  }

  function removeEmployee(id: string) {
    if (employees.length > 1) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  }

  function updateEmployee(id: string, field: keyof EmployeeRow, value: string | boolean) {
    setEmployees(
      employees.map((e) => {
        if (e.id !== id) return e;

        const updated = { ...e, [field]: value };

        // Level 1 변경 시 하위 레벨 초기화
        if (field === "orgLevel1") {
          updated.orgLevel2 = "";
          updated.orgLevel3 = "";
        }

        // Level 2 변경 시 Level 3 초기화
        if (field === "orgLevel2") {
          updated.orgLevel3 = "";
        }

        // 자동 생성 체크 시 사번 입력값 초기화
        if (field === "autoGenerateId" && value === true) {
          updated.employeeId = "";
        }

        return updated;
      })
    );
  }

  // 이메일 입력 완료 시 도메인 자동 추가
  function handleEmailBlur(id: string) {
    setEmployees(
      employees.map((e) => {
        if (e.id !== id) return e;

        const email = e.email.trim();
        if (email && !email.includes("@")) {
          return { ...e, email: email + COMPANY_EMAIL_DOMAIN };
        }
        return e;
      })
    );
  }

  function validateEmployee(emp: EmployeeRow): string[] {
    const errors: string[] = [];
    if (!emp.name.trim()) errors.push("이름");
    if (!emp.email.trim()) errors.push("이메일");
    if (!emp.email.endsWith(COMPANY_EMAIL_DOMAIN)) errors.push("이메일 도메인");
    if (!emp.orgLevel1) errors.push("부서");
    if (!emp.phoneNumber.trim()) errors.push("전화번호");
    return errors;
  }

  async function handleSubmit() {
    // 유효성 검사
    const invalidEmployees = employees.filter(
      (e) => validateEmployee(e).length > 0
    );
    if (invalidEmployees.length > 0) {
      alert("필수 필드를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employees: employees.map(({ id, autoGenerateId, ...rest }) => ({
            ...rest,
            // 자동 생성이면 employeeId를 undefined로 전송
            employeeId: autoGenerateId ? undefined : rest.employeeId || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "등록에 실패했습니다.");
      }

      setResult(data.data);

      if (data.data.successful > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(error instanceof Error ? error.message : "등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setEmployees([createEmptyEmployee()]);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      {/* 결과 표시 */}
      {result && (
        <Card className={result.failed > 0 ? "border-yellow-500" : "border-green-500"}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {result.failed === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-500" />
              )}
              등록 결과
            </CardTitle>
            <CardDescription>
              총 {result.total}명 중 {result.successful}명 성공, {result.failed}명
              실패
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.results.map((r, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    r.success ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  <span>
                    {r.name} ({r.email})
                    {r.employeeId && (
                      <span className="ml-2 text-muted-foreground">
                        사번: {r.employeeId}
                      </span>
                    )}
                  </span>
                  {r.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-red-500 text-xs">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={resetForm} className="mt-4" variant="outline">
              새로 등록하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 입력 폼 */}
      {!result && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {employees.length}명 입력 중 (최대 {MAX_EMPLOYEES}명)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmployee}
              disabled={employees.length >= MAX_EMPLOYEES}
            >
              <Plus className="w-4 h-4 mr-1" />
              직원 추가
            </Button>
          </div>

          <div className="space-y-4">
            {employees.map((emp, index) => (
              <Card key={emp.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      직원 {index + 1}
                    </CardTitle>
                    {employees.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmployee(emp.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 0행: 사번 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>사번</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`autoId-${emp.id}`}
                            checked={emp.autoGenerateId}
                            onCheckedChange={(checked) =>
                              updateEmployee(emp.id, "autoGenerateId", checked as boolean)
                            }
                          />
                          <Label
                            htmlFor={`autoId-${emp.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            자동 생성
                          </Label>
                        </div>
                      </div>
                      <Input
                        value={emp.employeeId || ""}
                        onChange={(e) =>
                          updateEmployee(emp.id, "employeeId", e.target.value)
                        }
                        placeholder={emp.autoGenerateId ? "자동 생성됨" : "예: 2025001"}
                        disabled={emp.autoGenerateId}
                        className={emp.autoGenerateId ? "bg-muted" : ""}
                      />
                    </div>
                  </div>

                  {/* 1행: 이름, 이메일 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        이름 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={emp.name}
                        onChange={(e) =>
                          updateEmployee(emp.id, "name", e.target.value)
                        }
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        이메일 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={emp.email}
                        onChange={(e) =>
                          updateEmployee(emp.id, "email", e.target.value)
                        }
                        onBlur={() => handleEmailBlur(emp.id)}
                        placeholder={`hong${COMPANY_EMAIL_DOMAIN}`}
                      />
                    </div>
                  </div>

                  {/* 2행: 조직 선택 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>
                        부서 <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={emp.orgLevel1}
                        onValueChange={(v) =>
                          updateEmployee(emp.id, "orgLevel1", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORG_LEVEL1_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {emp.orgLevel1 && hasLevel2(emp.orgLevel1) && (
                      <div className="space-y-2">
                        <Label>실</Label>
                        <Select
                          value={emp.orgLevel2 || ""}
                          onValueChange={(v) =>
                            updateEmployee(emp.id, "orgLevel2", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {getOrgLevel2Options(emp.orgLevel1).map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {emp.orgLevel1 &&
                      emp.orgLevel2 &&
                      hasLevel3(emp.orgLevel1, emp.orgLevel2) && (
                        <div className="space-y-2">
                          <Label>팀</Label>
                          <Select
                            value={emp.orgLevel3 || ""}
                            onValueChange={(v) =>
                              updateEmployee(emp.id, "orgLevel3", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {getOrgLevel3Options(
                                emp.orgLevel1,
                                emp.orgLevel2
                              ).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                  </div>

                  {/* 3행: 전화번호, 생년월일 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        전화번호 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={emp.phoneNumber}
                        onChange={(e) =>
                          updateEmployee(emp.id, "phoneNumber", e.target.value)
                        }
                        placeholder="010-1234-5678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>생년월일</Label>
                      <Input
                        type="date"
                        value={emp.birthdate || ""}
                        onChange={(e) =>
                          updateEmployee(emp.id, "birthdate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* 4행: 주소, 성별 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>주소</Label>
                      <Input
                        value={emp.address || ""}
                        onChange={(e) =>
                          updateEmployee(emp.id, "address", e.target.value)
                        }
                        placeholder="서울시 강남구"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>성별</Label>
                      <Select
                        value={emp.gender || ""}
                        onValueChange={(v) =>
                          updateEmployee(
                            emp.id,
                            "gender",
                            v as "male" | "female" | "other"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">남성</SelectItem>
                          <SelectItem value="female">여성</SelectItem>
                          <SelectItem value="other">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              초기화
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  등록 중...
                </>
              ) : (
                `${employees.length}명 등록하기`
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default EmployeeRegistrationForm;

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import {
  ORG_LEVEL1_OPTIONS,
  getOrgLevel2Options,
  getOrgLevel3Options,
} from "@/lib/constants/organization";
import type { EmployeeListItem } from "@/types/employee";

interface EmployeeEditDialogProps {
  employee: EmployeeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  employeeId: string;
  orgLevel1: string;
  orgLevel2: string;
  orgLevel3: string;
  phoneNumber: string;
  birthdate: string;
  gender: string;
}

export function EmployeeEditDialog({
  employee,
  open,
  onOpenChange,
  onSuccess,
}: EmployeeEditDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    employeeId: "",
    orgLevel1: "",
    orgLevel2: "",
    orgLevel3: "",
    phoneNumber: "",
    birthdate: "",
    gender: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when employee changes
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        employeeId: employee.employeeId || "",
        orgLevel1: employee.orgLevel1 || "",
        orgLevel2: employee.orgLevel2 || "",
        orgLevel3: employee.orgLevel3 || "",
        phoneNumber: employee.phoneNumber || "",
        birthdate: employee.birthdate || "",
        gender: employee.gender || "",
      });
      setError(null);
    }
  }, [employee]);

  // Reset level2/3 when level1 changes
  const handleOrgLevel1Change = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      orgLevel1: value,
      orgLevel2: "",
      orgLevel3: "",
    }));
  };

  // Reset level3 when level2 changes
  const handleOrgLevel2Change = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      orgLevel2: value,
      orgLevel3: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          employeeId: formData.employeeId,
          orgLevel1: formData.orgLevel1,
          orgLevel2: formData.orgLevel2 || undefined,
          orgLevel3: formData.orgLevel3 || undefined,
          phoneNumber: formData.phoneNumber,
          birthdate: formData.birthdate || undefined,
          gender: formData.gender || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "수정에 실패했습니다.");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const orgLevel2Options = formData.orgLevel1
    ? getOrgLevel2Options(formData.orgLevel1)
    : [];
  const orgLevel3Options =
    formData.orgLevel1 && formData.orgLevel2
      ? getOrgLevel3Options(formData.orgLevel1, formData.orgLevel2)
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>직원 정보 수정</DialogTitle>
          <DialogDescription>
            {employee?.email} 직원의 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* 이름 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                이름
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="col-span-3"
                required
              />
            </div>

            {/* 사번 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right">
                사번
              </Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, employeeId: e.target.value }))
                }
                className="col-span-3"
                required
              />
            </div>

            {/* 부서 (Level 1) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">부서</Label>
              <Select
                value={formData.orgLevel1}
                onValueChange={handleOrgLevel1Change}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="부서 선택" />
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

            {/* 실 (Level 2) */}
            {orgLevel2Options.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">실</Label>
                <Select
                  value={formData.orgLevel2}
                  onValueChange={handleOrgLevel2Change}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="실 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {orgLevel2Options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 팀 (Level 3) */}
            {orgLevel3Options.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">팀</Label>
                <Select
                  value={formData.orgLevel3}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, orgLevel3: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {orgLevel3Options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 전화번호 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                전화번호
              </Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                className="col-span-3"
                placeholder="010-0000-0000"
              />
            </div>

            {/* 생년월일 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birthdate" className="text-right">
                생년월일
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, birthdate: e.target.value }))
                }
                className="col-span-3"
              />
            </div>

            {/* 성별 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">성별</Label>
              <Select
                value={formData.gender || "none"}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, gender: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="성별 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안함</SelectItem>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EmployeeEditDialog;

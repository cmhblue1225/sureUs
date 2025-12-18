"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
} from "lucide-react";
import {
  ORG_LEVEL1_OPTIONS,
  getOrgLevel2Options,
  getOrgLevel3Options,
} from "@/lib/constants/organization";
import type { CSVParseResult, NewEmployeeData, BulkRegistrationResult } from "@/types/employee";

interface CSVUploadSectionProps {
  onSuccess?: () => void;
}

interface EditableEmployee extends NewEmployeeData {
  _id: string; // Unique ID for React key
  _isEditing?: boolean;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyEmployee(): EditableEmployee {
  return {
    _id: generateId(),
    name: "",
    email: "",
    orgLevel1: "",
    orgLevel2: "",
    orgLevel3: "",
    phoneNumber: "",
    birthdate: "",
    gender: undefined,
    employeeId: "",
    _isEditing: true,
  };
}

export function CSVUploadSection({ onSuccess }: CSVUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [editableData, setEditableData] = useState<EditableEmployee[]>([]);
  const [registrationResult, setRegistrationResult] =
    useState<BulkRegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      // Reset input
      e.target.value = "";
    },
    []
  );

  async function uploadFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setError("CSV 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setParseResult(null);
    setEditableData([]);
    setRegistrationResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/employees/csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "파일 파싱에 실패했습니다.");
      }

      setParseResult(data.data);
      // Convert to editable data with unique IDs
      setEditableData(
        data.data.data.map((emp: NewEmployeeData) => ({
          ...emp,
          _id: generateId(),
          _isEditing: false,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRegister() {
    if (editableData.length === 0) return;

    // Validate all rows before submitting
    const invalidRows = editableData.filter(
      (emp) => !emp.name || !emp.email || !emp.orgLevel1 || !emp.phoneNumber
    );
    if (invalidRows.length > 0) {
      setError(`${invalidRows.length}개 행에 필수 정보가 누락되었습니다.`);
      return;
    }

    setIsRegistering(true);
    setError(null);

    try {
      // Remove internal fields before sending
      const employeesToRegister = editableData.map(
        ({ _id, _isEditing, ...emp }) => emp
      );

      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: employeesToRegister }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "등록에 실패했습니다.");
      }

      setRegistrationResult(data.data);

      if (data.data.successful > 0) {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setIsRegistering(false);
    }
  }

  async function downloadTemplate() {
    try {
      const response = await fetch("/api/admin/employees/csv");
      if (!response.ok) {
        throw new Error("템플릿 다운로드에 실패했습니다.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "신입사원_템플릿.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "다운로드 실패");
    }
  }

  function reset() {
    setParseResult(null);
    setEditableData([]);
    setRegistrationResult(null);
    setError(null);
    setEditingRowId(null);
  }

  function handleEditRow(id: string) {
    setEditingRowId(id);
  }

  function handleSaveRow(id: string) {
    setEditingRowId(null);
  }

  function handleCancelEdit(id: string) {
    setEditingRowId(null);
  }

  function handleDeleteRow(id: string) {
    setEditableData((prev) => prev.filter((emp) => emp._id !== id));
  }

  function handleAddRow() {
    const newEmployee = createEmptyEmployee();
    setEditableData((prev) => [...prev, newEmployee]);
    setEditingRowId(newEmployee._id);
  }

  function updateEmployee(id: string, field: keyof NewEmployeeData, value: string) {
    setEditableData((prev) =>
      prev.map((emp) => {
        if (emp._id !== id) return emp;

        const updated = { ...emp, [field]: value };

        // Reset dependent fields when parent changes
        if (field === "orgLevel1") {
          updated.orgLevel2 = "";
          updated.orgLevel3 = "";
        } else if (field === "orgLevel2") {
          updated.orgLevel3 = "";
        }

        return updated;
      })
    );
  }

  return (
    <div className="space-y-6">
      {/* 템플릿 다운로드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            CSV 템플릿
          </CardTitle>
          <CardDescription>
            아래 템플릿을 다운로드하여 직원 정보를 입력한 후 업로드하세요.
            (최대 200명까지 한 번에 등록 가능)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            템플릿 다운로드
          </Button>
        </CardContent>
      </Card>

      {/* 등록 결과 */}
      {registrationResult && (
        <Card
          className={
            registrationResult.failed > 0
              ? "border-yellow-500"
              : "border-green-500"
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {registrationResult.failed === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              등록 결과
            </CardTitle>
            <CardDescription>
              총 {registrationResult.total}명 중 {registrationResult.successful}
              명 성공, {registrationResult.failed}명 실패
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {registrationResult.results.map((r, idx) => (
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
            <Button onClick={reset} className="mt-4" variant="outline">
              새로 업로드하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 파일 업로드 영역 */}
      {!registrationResult && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${isUploading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  파일 분석 중...
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  CSV 파일을 여기에 드래그하거나
                </p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">파일 선택</span>
                  </Button>
                </label>
              </>
            )}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* 파싱 결과 편집 가능한 미리보기 */}
          {parseResult && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pencil className="w-5 h-5" />
                      등록 데이터 편집
                    </CardTitle>
                    <CardDescription>
                      {editableData.length}명의 직원 정보를 확인하고 수정할 수 있습니다.
                      {parseResult.errors.length > 0 && (
                        <span className="text-yellow-500 ml-2">
                          (CSV 파싱 시 {parseResult.errors.length}개 오류 발견)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRow}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    행 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 오류 목록 */}
                {parseResult.errors.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg space-y-1">
                    <p className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      CSV 파싱 오류 (아래 편집 기능으로 수정 가능)
                    </p>
                    {parseResult.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {err.row}행 [{err.field}]: {err.message}
                      </p>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... 외 {parseResult.errors.length - 5}개
                      </p>
                    )}
                  </div>
                )}

                {/* 편집 가능한 데이터 테이블 */}
                {editableData.length > 0 && (
                  <div className="max-h-[500px] overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead className="w-24">사번</TableHead>
                          <TableHead className="w-24">이름 *</TableHead>
                          <TableHead className="w-48">이메일 *</TableHead>
                          <TableHead className="w-36">부서 *</TableHead>
                          <TableHead className="w-36">실</TableHead>
                          <TableHead className="w-36">팀</TableHead>
                          <TableHead className="w-32">전화번호 *</TableHead>
                          <TableHead className="w-24">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editableData.map((emp, idx) => {
                          const isEditing = editingRowId === emp._id;
                          const orgLevel2Options = emp.orgLevel1
                            ? getOrgLevel2Options(emp.orgLevel1)
                            : [];
                          const orgLevel3Options =
                            emp.orgLevel1 && emp.orgLevel2
                              ? getOrgLevel3Options(emp.orgLevel1, emp.orgLevel2)
                              : [];

                          return (
                            <TableRow
                              key={emp._id}
                              className={
                                isEditing ? "bg-muted/50" : undefined
                              }
                            >
                              <TableCell className="text-muted-foreground">
                                {idx + 1}
                              </TableCell>

                              {/* 사번 */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    className="h-8 text-xs"
                                    value={emp.employeeId || ""}
                                    onChange={(e) =>
                                      updateEmployee(emp._id, "employeeId", e.target.value)
                                    }
                                    placeholder="자동"
                                  />
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {emp.employeeId || "(자동)"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 이름 */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    className="h-8 text-xs"
                                    value={emp.name}
                                    onChange={(e) =>
                                      updateEmployee(emp._id, "name", e.target.value)
                                    }
                                    placeholder="이름"
                                  />
                                ) : (
                                  <span className={!emp.name ? "text-red-500" : ""}>
                                    {emp.name || "(미입력)"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 이메일 */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    className="h-8 text-xs"
                                    value={emp.email}
                                    onChange={(e) =>
                                      updateEmployee(emp._id, "email", e.target.value)
                                    }
                                    placeholder="email@suresofttech.com"
                                  />
                                ) : (
                                  <span
                                    className={`text-xs ${
                                      !emp.email ? "text-red-500" : ""
                                    }`}
                                  >
                                    {emp.email || "(미입력)"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 부서 (Level 1) */}
                              <TableCell>
                                {isEditing ? (
                                  <Select
                                    value={emp.orgLevel1 || "none"}
                                    onValueChange={(v) =>
                                      updateEmployee(
                                        emp._id,
                                        "orgLevel1",
                                        v === "none" ? "" : v
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="부서" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">선택</SelectItem>
                                      {ORG_LEVEL1_OPTIONS.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span
                                    className={`text-xs ${
                                      !emp.orgLevel1 ? "text-red-500" : ""
                                    }`}
                                  >
                                    {emp.orgLevel1 || "(미입력)"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 실 (Level 2) */}
                              <TableCell>
                                {isEditing ? (
                                  <Select
                                    value={emp.orgLevel2 || "none"}
                                    onValueChange={(v) =>
                                      updateEmployee(
                                        emp._id,
                                        "orgLevel2",
                                        v === "none" ? "" : v
                                      )
                                    }
                                    disabled={orgLevel2Options.length === 0}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="실" />
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
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {emp.orgLevel2 || "-"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 팀 (Level 3) */}
                              <TableCell>
                                {isEditing ? (
                                  <Select
                                    value={emp.orgLevel3 || "none"}
                                    onValueChange={(v) =>
                                      updateEmployee(
                                        emp._id,
                                        "orgLevel3",
                                        v === "none" ? "" : v
                                      )
                                    }
                                    disabled={orgLevel3Options.length === 0}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="팀" />
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
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {emp.orgLevel3 || "-"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 전화번호 */}
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    className="h-8 text-xs"
                                    value={emp.phoneNumber}
                                    onChange={(e) =>
                                      updateEmployee(emp._id, "phoneNumber", e.target.value)
                                    }
                                    placeholder="010-0000-0000"
                                  />
                                ) : (
                                  <span
                                    className={`text-xs ${
                                      !emp.phoneNumber ? "text-red-500" : ""
                                    }`}
                                  >
                                    {emp.phoneNumber || "(미입력)"}
                                  </span>
                                )}
                              </TableCell>

                              {/* 관리 버튼 */}
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleSaveRow(emp._id)}
                                        title="저장"
                                      >
                                        <Save className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleCancelEdit(emp._id)}
                                        title="취소"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleEditRow(emp._id)}
                                        title="수정"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteRow(emp._id)}
                                        title="삭제"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {editableData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>등록할 데이터가 없습니다.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleAddRow}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      직원 추가
                    </Button>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    * 표시된 필드는 필수입니다. 사번은 비워두면 자동 생성됩니다.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={reset}>
                      취소
                    </Button>
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering || editableData.length === 0}
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          등록 중...
                        </>
                      ) : (
                        `${editableData.length}명 등록하기`
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default CSVUploadSection;

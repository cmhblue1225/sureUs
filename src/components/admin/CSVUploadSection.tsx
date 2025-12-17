"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import type { CSVParseResult, NewEmployeeData, BulkRegistrationResult } from "@/types/employee";

interface CSVUploadSectionProps {
  onSuccess?: () => void;
}

export function CSVUploadSection({ onSuccess }: CSVUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [registrationResult, setRegistrationResult] =
    useState<BulkRegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRegister() {
    if (!parseResult || parseResult.data.length === 0) return;

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: parseResult.data }),
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
      a.download = "employee_template.csv";
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
    setRegistrationResult(null);
    setError(null);
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

          {/* 파싱 결과 미리보기 */}
          {parseResult && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">미리보기</CardTitle>
                <CardDescription>
                  {parseResult.data.length}명의 직원 정보가 파싱되었습니다.
                  {parseResult.errors.length > 0 && (
                    <span className="text-yellow-500 ml-2">
                      ({parseResult.errors.length}개 오류)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 오류 목록 */}
                {parseResult.errors.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg space-y-1">
                    <p className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      파싱 오류
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

                {/* 데이터 테이블 */}
                {parseResult.data.length > 0 && (
                  <div className="max-h-80 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>이름</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>부서</TableHead>
                          <TableHead>전화번호</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parseResult.data.slice(0, 10).map((emp, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{emp.name}</TableCell>
                            <TableCell className="text-xs">
                              {emp.email}
                            </TableCell>
                            <TableCell className="text-xs">
                              {[emp.orgLevel1, emp.orgLevel2, emp.orgLevel3]
                                .filter(Boolean)
                                .join(" > ")}
                            </TableCell>
                            <TableCell className="text-xs">
                              {emp.phoneNumber}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parseResult.data.length > 10 && (
                      <p className="text-xs text-muted-foreground p-2 text-center border-t">
                        ... 외 {parseResult.data.length - 10}명
                      </p>
                    )}
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={reset}>
                    취소
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={
                      isRegistering ||
                      parseResult.data.length === 0 ||
                      !parseResult.valid
                    }
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      `${parseResult.data.length}명 등록하기`
                    )}
                  </Button>
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

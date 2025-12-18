"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Users, Pencil, Trash2 } from "lucide-react";
import { ORG_LEVEL1_OPTIONS } from "@/lib/constants/organization";
import { EmployeeEditDialog } from "./EmployeeEditDialog";
import { EmployeeDeleteDialog } from "./EmployeeDeleteDialog";
import type { EmployeeListItem, EmployeeListResponse } from "@/types/employee";

interface EmployeeListTableProps {
  refreshTrigger?: number;
}

export function EmployeeListTable({ refreshTrigger }: EmployeeListTableProps) {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [orgLevel1Filter, setOrgLevel1Filter] = useState<string>("all");
  const limit = 20;

  // Dialog states
  const [editingEmployee, setEditingEmployee] = useState<EmployeeListItem | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeListItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (orgLevel1Filter && orgLevel1Filter !== "all") {
        params.append("orgLevel1", orgLevel1Filter);
      }

      const response = await fetch(`/api/admin/employees?${params}`);
      const data = await response.json();

      if (data.success) {
        const result = data.data as EmployeeListResponse;
        setEmployees(result.employees);
        setTotal(result.pagination.total);
        setHasMore(result.pagination.hasMore);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, orgLevel1Filter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, refreshTrigger]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [orgLevel1Filter]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  const handleEditClick = (employee: EmployeeListItem) => {
    setEditingEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: EmployeeListItem) => {
    setDeletingEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchEmployees();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            등록된 직원 ({total}명)
          </CardTitle>

          {/* 필터 */}
          <Select value={orgLevel1Filter} onValueChange={setOrgLevel1Filter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="부서 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {ORG_LEVEL1_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            등록된 직원이 없습니다.
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>사번</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>부서</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="w-24 text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp, idx) => (
                    <TableRow key={emp.id}>
                      <TableCell className="text-muted-foreground">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell className="font-mono">
                        {emp.employeeId}
                      </TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-xs">{emp.email}</TableCell>
                      <TableCell className="text-xs">
                        {[emp.orgLevel1, emp.orgLevel2, emp.orgLevel3]
                          .filter(Boolean)
                          .join(" > ")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {emp.phoneNumber || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(emp.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(emp)}
                            title="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(emp)}
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * limit + 1} - {Math.min(page * limit, total)} / {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm px-2">{page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <EmployeeEditDialog
        employee={editingEmployee}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Dialog */}
      <EmployeeDeleteDialog
        employee={deletingEmployee}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </Card>
  );
}

export default EmployeeListTable;

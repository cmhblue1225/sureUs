"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { MoveUserModal } from "./MoveUserModal";

interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  phoneNumber: string | null;
  orgLevel1: string | null;
  orgLevel2: string | null;
  orgLevel3: string | null;
  role: string | null;
}

interface CohortUserListProps {
  cohortId: string;
  cohortName: string;
}

export function CohortUserList({ cohortId, cohortName }: CohortUserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [showMoveModal, setShowMoveModal] = useState(false);

  const fetchUsers = useCallback(async (page: number = 1, searchQuery: string = "") => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(
        `/api/admin/cohorts/${cohortId}/users?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cohortId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchUsers(1, search);
  }

  function toggleSelectAll() {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  }

  function toggleSelectUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  function handleMoveSuccess() {
    setSelectedUserIds([]);
    fetchUsers(pagination.page, search);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름 또는 이메일 검색"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            검색
          </Button>
        </form>

        <Button
          onClick={() => setShowMoveModal(true)}
          disabled={selectedUserIds.length === 0}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          {selectedUserIds.length}명 이동
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    users.length > 0 && selectedUserIds.length === users.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>사번</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>역할</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.employeeId || "-"}
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell className="text-sm">
                    {[user.orgLevel1, user.orgLevel2, user.orgLevel3]
                      .filter(Boolean)
                      .join(" > ") || "-"}
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        관리자
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        일반
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            총 {pagination.total}명
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(pagination.page - 1, search)}
              disabled={pagination.page <= 1}
            >
              이전
            </Button>
            <span className="flex items-center px-3">
              {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(pagination.page + 1, search)}
              disabled={!pagination.hasMore}
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 이동 모달 */}
      <MoveUserModal
        open={showMoveModal}
        onOpenChange={setShowMoveModal}
        selectedUserIds={selectedUserIds}
        currentCohortId={cohortId}
        currentCohortName={cohortName}
        onSuccess={handleMoveSuccess}
      />
    </div>
  );
}

export default CohortUserList;

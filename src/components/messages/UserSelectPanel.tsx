"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Search, Loader2, Users } from "lucide-react";

interface CohortUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  department: string | null;
  job_role: string | null;
}

interface UserSelectPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (userIds: string[]) => Promise<void>;
}

export function UserSelectPanel({
  open,
  onOpenChange,
  onSelect,
}: UserSelectPanelProps) {
  const [users, setUsers] = useState<CohortUser[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch cohort users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/messages/cohort-users");
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch cohort users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
      setSelectedIds(new Set());
      setSearchQuery("");
    }
  }, [open, fetchUsers]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.department?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Toggle user selection
  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Toggle all visible users
  const toggleAll = () => {
    const allFilteredIds = filteredUsers.map((u) => u.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      // Deselect all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      await onSelect(Array.from(selectedIds));
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create conversations:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const isAllSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedIds.has(u.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            대화 상대 선택
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 부서, 이메일로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Select all */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex items-center gap-2 py-2 border-b">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={toggleAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              전체 선택 ({filteredUsers.length}명)
            </label>
            {selectedIds.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedIds.size}명 선택됨
              </span>
            )}
          </div>
        )}

        {/* User list */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "기수 내 사용자가 없습니다"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                    selectedIds.has(user.id)
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <UserAvatar
                    src={user.avatar_url}
                    alt={user.name}
                    size="sm"
                    className="w-8 h-8 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.department || user.job_role || user.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0 || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                생성 중...
              </>
            ) : (
              `${selectedIds.size}명에게 메시지`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

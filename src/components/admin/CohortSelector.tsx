"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Users, LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface Cohort {
  id: string;
  name: string;
}

interface CohortSelectorProps {
  className?: string;
}

export function CohortSelector({ className }: CohortSelectorProps) {
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 현재 선택된 기수 조회
        const selectResponse = await fetch("/api/admin/cohorts/select");
        const selectData = await selectResponse.json();
        if (selectData.success && selectData.data) {
          setSelectedCohort(selectData.data);
        }

        // 기수 목록 조회
        const listResponse = await fetch("/api/admin/cohorts");
        const listData = await listResponse.json();
        if (listData.success) {
          setCohorts(listData.data);
        }
      } catch (error) {
        console.error("Failed to fetch cohorts:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleSelectCohort(cohortId: string) {
    try {
      const response = await fetch("/api/admin/cohorts/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cohortId }),
      });

      const data = await response.json();
      if (data.success) {
        const selected = cohorts.find((c) => c.id === cohortId);
        if (selected) {
          setSelectedCohort(selected);
        }
        // 페이지 새로고침하여 데이터 갱신
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Failed to select cohort:", error);
    }
  }

  async function handleClearSelection() {
    try {
      const response = await fetch("/api/admin/cohorts/select", {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setSelectedCohort(null);
        window.location.href = "/admin/cohorts";
      }
    } catch (error) {
      console.error("Failed to clear selection:", error);
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Users className="w-4 h-4 mr-2" />
        로딩 중...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Users className="w-4 h-4 mr-2" />
          {selectedCohort ? selectedCohort.name : "기수 선택"}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>기수 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cohorts.map((cohort) => (
          <DropdownMenuItem
            key={cohort.id}
            onClick={() => handleSelectCohort(cohort.id)}
            className={selectedCohort?.id === cohort.id ? "bg-accent" : ""}
          >
            {cohort.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/cohorts" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            기수 관리
          </Link>
        </DropdownMenuItem>
        {selectedCohort && (
          <DropdownMenuItem
            onClick={handleClearSelection}
            className="text-muted-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            선택 해제
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CohortSelector;

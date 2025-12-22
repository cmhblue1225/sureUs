"use client";

/**
 * CohortMemberList Component
 *
 * 같은 기수 동료들을 카드 그리드 형태로 표시
 * 검색, 정렬, 필터 기능 포함
 */

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, User, Building2, Briefcase, Users } from "lucide-react";
import type { ClusteredNode } from "@/lib/graph/clustering";

// RadialNetworkNode 타입 (network page에서 사용)
interface RadialNetworkNode {
  id: string;
  userId: string;
  name: string;
  department: string;
  jobRole: string;
  officeLocation: string;
  mbti?: string;
  avatarUrl?: string;
  hobbies: string[];
  isCurrentUser: boolean;
  similarityScore: number;
}

interface CohortMemberListProps {
  members: RadialNetworkNode[];
  currentUserId?: string;
  onViewProfile: (node: ClusteredNode) => void;
}

export function CohortMemberList({
  members,
  currentUserId,
  onViewProfile,
}: CohortMemberListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [mbtiFilter, setMbtiFilter] = useState<string>("all");

  // 부서 목록 (동적 생성)
  const departments = useMemo(() => {
    const depts = new Set<string>();
    members.forEach((m) => {
      if (m.department) depts.add(m.department);
    });
    return Array.from(depts).sort((a, b) => a.localeCompare(b, "ko"));
  }, [members]);

  // MBTI 목록 (동적 생성)
  const mbtis = useMemo(() => {
    const mbtiSet = new Set<string>();
    members.forEach((m) => {
      if (m.mbti) mbtiSet.add(m.mbti);
    });
    return Array.from(mbtiSet).sort();
  }, [members]);

  // 필터링 및 정렬 (이름순)
  const filteredMembers = useMemo(() => {
    return members
      // 1. 현재 사용자 제외
      .filter((m) => !m.isCurrentUser && m.userId !== currentUserId)
      // 2. 검색 필터
      .filter((m) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(query) ||
          m.department?.toLowerCase().includes(query) ||
          m.jobRole?.toLowerCase().includes(query)
        );
      })
      // 3. 부서 필터
      .filter((m) => departmentFilter === "all" || m.department === departmentFilter)
      // 4. MBTI 필터
      .filter((m) => mbtiFilter === "all" || m.mbti === mbtiFilter)
      // 5. 이름순 정렬
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [members, currentUserId, searchQuery, departmentFilter, mbtiFilter]);

  // RadialNetworkNode → ClusteredNode 변환
  const handleViewProfile = (member: RadialNetworkNode) => {
    const node: ClusteredNode = {
      id: member.id,
      userId: member.userId,
      name: member.name,
      department: member.department,
      jobRole: member.jobRole,
      officeLocation: member.officeLocation,
      mbti: member.mbti,
      avatarUrl: member.avatarUrl,
      hobbies: member.hobbies,
      isCurrentUser: member.isCurrentUser,
      clusterId: "",
      position: { x: 0, y: 0 },
    };
    onViewProfile(node);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setMbtiFilter("all");
  };

  const hasActiveFilters =
    searchQuery || departmentFilter !== "all" || mbtiFilter !== "all";

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 영역 */}
      <div className="space-y-3">
        {/* 검색 입력 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 부서, 직군으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* 부서 필터 */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="부서" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 부서</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* MBTI 필터 */}
          <Select value={mbtiFilter} onValueChange={setMbtiFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="MBTI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 MBTI</SelectItem>
              {mbtis.map((mbti) => (
                <SelectItem key={mbti} value={mbti}>
                  {mbti}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 필터 초기화 */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              초기화
            </Button>
          )}

          {/* 결과 수 */}
          <div className="ml-auto text-sm text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            {filteredMembers.length}명
          </div>
        </div>
      </div>

      {/* 멤버 그리드 */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">검색 결과가 없습니다</p>
          <p className="text-sm">다른 검색어나 필터를 시도해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onViewProfile={() => handleViewProfile(member)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 멤버 카드 컴포넌트
interface MemberCardProps {
  member: RadialNetworkNode;
  onViewProfile: () => void;
}

function MemberCard({ member, onViewProfile }: MemberCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          {/* 아바타 */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center overflow-hidden mb-3">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* 이름 */}
          <h3 className="font-semibold text-sm truncate w-full">{member.name}</h3>

          {/* 부서 */}
          {member.department && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{member.department}</span>
            </div>
          )}

          {/* 직군 */}
          {member.jobRole && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{member.jobRole}</span>
            </div>
          )}

          {/* 배지 영역 */}
          {member.mbti && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
              <Badge
                variant="secondary"
                className="text-[10px] font-mono px-1.5 py-0 h-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800"
              >
                {member.mbti}
              </Badge>
            </div>
          )}

          {/* 프로필 보기 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={onViewProfile}
          >
            프로필 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

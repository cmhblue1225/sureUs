"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, User, MapPin, Briefcase, Building, Loader2 } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { JOB_ROLES } from "@/lib/constants/jobRoles";
import { OFFICE_LOCATIONS } from "@/lib/constants/locations";
import Link from "next/link";

interface SearchUser {
  id: string;
  name: string;
  department?: string;
  jobRole?: string;
  officeLocation?: string;
  avatarUrl?: string;
  hobbies: string[];
  mbti?: string;
  similarity?: {
    score: number;
    commonTags: string[];
    matchReasons: string[];
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [department, setDepartment] = useState(searchParams.get("department") || "");
  const [jobRole, setJobRole] = useState(searchParams.get("jobRole") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false,
  });

  const handleSearch = async (page = 1) => {
    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (department) params.set("department", department);
      if (jobRole) params.set("jobRole", jobRole);
      if (location) params.set("location", location);
      params.set("page", page.toString());

      const response = await fetch(`/api/search/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(1);

    // Update URL
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (department) params.set("department", department);
    if (jobRole) params.set("jobRole", jobRole);
    if (location) params.set("location", location);
    router.push(`/search?${params}`);
  };

  // Search on mount if there are params
  useEffect(() => {
    if (searchParams.get("q") || searchParams.get("department")) {
      handleSearch(1);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">동료 검색</h1>
        <p className="text-muted-foreground mt-1">
          이름, 부서, 관심사로 동료를 찾아보세요
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름, 키워드로 검색..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "검색"
                )}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Select
                value={department || "__all__"}
                onValueChange={(v) => setDepartment(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체 부서</SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={jobRole || "__all__"}
                onValueChange={(v) => setJobRole(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="직군 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체 직군</SelectItem>
                  {JOB_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={location || "__all__"}
                onValueChange={(v) => setLocation(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="근무지 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체 근무지</SelectItem>
                  {OFFICE_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {pagination.total}명의 동료를 찾았습니다
          </div>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  검색 결과가 없습니다. 다른 검색어를 시도해보세요.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{user.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1 text-xs text-muted-foreground">
                            {user.department && (
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {user.department}
                              </span>
                            )}
                            {user.jobRole && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {user.jobRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Hobbies */}
                      {user.hobbies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {user.hobbies.slice(0, 4).map((hobby) => (
                            <Badge key={hobby} variant="secondary" className="text-xs">
                              {hobby}
                            </Badge>
                          ))}
                          {user.hobbies.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.hobbies.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Similarity */}
                      {user.similarity && user.similarity.commonTags.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            공통 관심사: {user.similarity.commonTags.slice(0, 3).join(", ")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Load More */}
          {pagination.hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => handleSearch(pagination.page + 1)}
                disabled={loading}
              >
                더 보기
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">동료를 검색해보세요</h3>
            <p className="text-sm text-muted-foreground mt-1">
              이름, 부서, 직군, 관심사로 검색할 수 있습니다
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

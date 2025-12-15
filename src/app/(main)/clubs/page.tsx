"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClubCard } from "@/components/clubs/ClubCard";
import ClubRecommendations from "@/components/clubs/ClubRecommendations";
import { Plus, Search, Loader2, Users, Filter } from "lucide-react";

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  join_policy: string;
  member_count: number;
  tags: string[];
  leader: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  isMember: boolean;
  isLeader: boolean;
  hasPendingRequest: boolean;
}

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "스포츠", label: "스포츠" },
  { value: "취미", label: "취미" },
  { value: "자기개발", label: "자기개발" },
  { value: "기술/IT", label: "기술/IT" },
  { value: "소셜", label: "소셜" },
  { value: "문화/예술", label: "문화/예술" },
  { value: "기타", label: "기타" },
];

export default function ClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [myClubs, setMyClubs] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchClubs = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });

      if (category !== "all") {
        params.set("category", category);
      }
      if (search) {
        params.set("search", search);
      }
      if (myClubs) {
        params.set("myClubs", "true");
      }

      const response = await fetch(`/api/clubs?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setClubs(data.data.clubs);
          setPage(1);
        } else {
          setClubs(prev => currentPage === 1 ? data.data.clubs : [...prev, ...data.data.clubs]);
        }
        setHasMore(data.data.pagination.hasMore);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch clubs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs(true);
  }, [category, myClubs]);

  const handleSearch = () => {
    fetchClubs(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      fetchClubs(false);
    }
  }, [page]);

  const handleJoin = async (clubId: string) => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/join`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Refresh the clubs list
        fetchClubs(true);
      } else {
        alert(data.error || "가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Join error:", error);
      alert("가입 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">동호회</h1>
          <p className="text-muted-foreground mt-1">
            관심사가 맞는 동료들과 함께하는 동호회에 참여하세요
          </p>
        </div>
        <Button onClick={() => router.push("/clubs/create")} className="gap-2">
          <Plus className="w-4 h-4" />
          동호회 만들기
        </Button>
      </div>

      {/* Recommendations - Show when not filtering */}
      {!myClubs && category === "all" && !search && (
        <ClubRecommendations limit={3} compact />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="동호회 이름으로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" onClick={handleSearch}>
                검색
              </Button>
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* My Clubs Toggle */}
            <Button
              variant={myClubs ? "default" : "outline"}
              onClick={() => setMyClubs(!myClubs)}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              내 동호회
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      {!loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{total}개</Badge>
          <span>동호회</span>
          {myClubs && <Badge variant="outline">내 동호회만</Badge>}
          {category !== "all" && <Badge variant="outline">{category}</Badge>}
        </div>
      )}

      {/* Clubs Grid */}
      {loading && clubs.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : clubs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">동호회가 없습니다</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {myClubs
                ? "가입한 동호회가 없습니다. 새로운 동호회에 가입해보세요!"
                : "검색 결과가 없습니다. 다른 조건으로 검색해보세요."}
            </p>
            {myClubs && (
              <Button
                variant="default"
                className="mt-4"
                onClick={() => setMyClubs(false)}
              >
                전체 동호회 보기
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} onJoin={handleJoin} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                더 보기
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

/**
 * Keyword Filter Component
 *
 * Allows users to filter network graph by hobby/interest tags
 * Supports both tag selection buttons and text search
 */

import { useState, useMemo } from "react";
import { X, Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { HOBBY_TAGS } from "@/lib/constants/hobbyTags";

interface KeywordFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  filterMode: "any" | "all";
  onFilterModeChange: (mode: "any" | "all") => void;
}

// 인기 태그 (상위 10개)
const POPULAR_TAGS = [
  "러닝",
  "헬스",
  "게임",
  "독서",
  "영화",
  "음악",
  "여행",
  "요리",
  "캠핑",
  "사진",
];

export function KeywordFilter({
  selectedTags,
  onTagsChange,
  filterMode,
  onFilterModeChange,
}: KeywordFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  // 검색어로 필터링된 태그
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return HOBBY_TAGS.filter(
      (tag) =>
        tag.toLowerCase().includes(query) && !selectedTags.includes(tag)
    ).slice(0, 5);
  }, [searchQuery, selectedTags]);

  // 표시할 태그 (선택되지 않은 인기 태그)
  const displayTags = useMemo(() => {
    const tags = showAllTags ? HOBBY_TAGS : POPULAR_TAGS;
    return tags.filter((tag) => !selectedTags.includes(tag));
  }, [selectedTags, showAllTags]);

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setSearchQuery("");
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleReset = () => {
    onTagsChange([]);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredTags.length > 0) {
      handleAddTag(filteredTags[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">키워드 필터</Label>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 선택된 태그 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs cursor-pointer hover:bg-secondary/80"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="태그 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-8 h-9 text-sm"
        />
        {/* 자동완성 드롭다운 */}
        {filteredTags.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
            {filteredTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent first:rounded-t-md last:rounded-b-md"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 인기 태그 / 전체 태그 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {showAllTags ? "전체 태그" : "인기 태그"}
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowAllTags(!showAllTags)}
            className="h-auto p-0 text-xs"
          >
            {showAllTags ? "간략히" : "전체 보기"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {displayTags.slice(0, showAllTags ? undefined : 10).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-accent text-xs"
              onClick={() => handleAddTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* 필터 모드 */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <span className="text-xs text-muted-foreground">필터 조건:</span>
        <div className="flex gap-1">
          <Button
            variant={filterMode === "any" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterModeChange("any")}
            className="h-7 text-xs"
          >
            하나라도
          </Button>
          <Button
            variant={filterMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterModeChange("all")}
            className="h-7 text-xs"
          >
            모두 포함
          </Button>
        </div>
      </div>

      {/* 필터 결과 안내 */}
      {selectedTags.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.join(", ")} 태그를{" "}
          {filterMode === "any" ? "하나라도" : "모두"} 가진 동료를 표시합니다.
        </p>
      )}
    </div>
  );
}

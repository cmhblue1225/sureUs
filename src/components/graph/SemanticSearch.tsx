"use client";

/**
 * 의미 검색 컴포넌트
 * 자연어 쿼리로 동료를 검색
 */

import { useState, useCallback } from "react";
import { Search, Loader2, Sparkles, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { ExpandedQuery } from "@/lib/anthropic/queryExpansion";

interface SemanticSearchNode {
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
  clusterId: string;
  position: { x: number; y: number };
  matchScore?: number;
  matchReasons?: string[];
}

interface SemanticSearchEdge {
  id: string;
  source: string;
  target: string;
  similarity: number;
  commonTags: string[];
  connectionType: string;
  strengthLevel: string;
  mbtiCompatible: boolean;
}

interface SemanticSearchResult {
  nodes: SemanticSearchNode[];
  edges: SemanticSearchEdge[];
  searchMeta: {
    originalQuery: string;
    expandedQuery: ExpandedQuery;
    totalResults: number;
    searchTime: number;
    usedFallback: boolean;
  };
}

interface SemanticSearchProps {
  onSearchResults: (results: SemanticSearchResult | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// 예시 검색어
const EXAMPLE_QUERIES = [
  "밝고 쾌활한",
  "논리적인 개발자",
  "창의적인 아이디어",
  "꼼꼼하고 체계적인",
  "소통을 잘하는",
];

export function SemanticSearch({
  onSearchResults,
  isLoading,
  setIsLoading,
}: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<SemanticSearchResult["searchMeta"] | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/graph/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "검색에 실패했습니다.");
        onSearchResults(null);
        return;
      }

      setSearchMeta(result.data.searchMeta);
      onSearchResults(result.data);
    } catch (err) {
      console.error("Semantic search error:", err);
      setError("검색 중 오류가 발생했습니다.");
      onSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading, setIsLoading, onSearchResults]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSearch();
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleReset = () => {
    setQuery("");
    setError(null);
    setSearchMeta(null);
    onSearchResults(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-purple-500" />
          의미 검색
        </Label>
        {searchMeta && (
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

      {/* 검색 입력 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="어떤 동료를 찾고 계신가요?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 h-9 text-sm"
            disabled={isLoading}
          />
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={!query.trim() || isLoading}
          className="h-9"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "검색"
          )}
        </Button>
      </div>

      {/* 예시 검색어 */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">예시:</span>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUERIES.map((example) => (
            <Badge
              key={example}
              variant="outline"
              className="cursor-pointer hover:bg-accent text-xs"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </Badge>
          ))}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* AI 분석 결과 */}
      {searchMeta && (
        <div className="space-y-2 pt-2 border-t">
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI 분석 결과
              {searchMeta.usedFallback && (
                <span className="text-yellow-600">(기본 모드)</span>
              )}
            </span>
            {showAnalysis ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showAnalysis && (
            <div className="space-y-2 text-xs bg-muted/50 rounded-md p-3">
              {/* 확장된 설명 */}
              {searchMeta.expandedQuery.expandedDescription !== searchMeta.originalQuery && (
                <div>
                  <span className="text-muted-foreground">확장 검색어: </span>
                  <span>{searchMeta.expandedQuery.expandedDescription}</span>
                </div>
              )}

              {/* 추천 MBTI */}
              {searchMeta.expandedQuery.suggestedMbtiTypes.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">추천 MBTI:</span>
                  {searchMeta.expandedQuery.suggestedMbtiTypes.map((mbti) => (
                    <Badge key={mbti} variant="secondary" className="text-xs py-0">
                      {mbti}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 관련 태그 */}
              {searchMeta.expandedQuery.suggestedHobbyTags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">관련 태그:</span>
                  {searchMeta.expandedQuery.suggestedHobbyTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 검색 키워드 */}
              {searchMeta.expandedQuery.searchKeywords.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">키워드:</span>
                  {searchMeta.expandedQuery.searchKeywords.map((keyword) => (
                    <span key={keyword} className="text-foreground">
                      {keyword}
                    </span>
                  )).reduce((prev, curr, i) => (
                    <>{prev}{i > 0 && ", "}{curr}</>
                  ) as unknown as React.ReactElement, <></>)}
                </div>
              )}
            </div>
          )}

          {/* 검색 결과 요약 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{searchMeta.totalResults}명의 동료를 찾았습니다</span>
            <span>{searchMeta.searchTime}ms</span>
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      {!searchMeta && !error && (
        <p className="text-xs text-muted-foreground pt-2 border-t">
          자연어로 찾고 싶은 동료의 특징을 입력하면 AI가 분석하여 맞는 동료를 찾아드립니다.
        </p>
      )}
    </div>
  );
}

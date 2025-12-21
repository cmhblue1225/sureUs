"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, Utensils, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HobbyTag } from "./HobbyTag";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import { DEFAULT_HOBBY_TAGS, type StepProps } from "@/types/onboarding";

const MAX_HOBBIES = 10;
const SUGGESTION_DEBOUNCE_MS = 800;
const MAX_SUGGESTED_TAGS = 15;

export function StepHobbies({
  state,
  updateState,
  onNext,
  onPrev,
  onSkip,
}: StepProps) {
  const [customHobby, setCustomHobby] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnyValue = state.hobbies.size > 0 || state.interests || state.favoriteFood;

  // 선택된 태그 기반으로 추천 태그 요청 (누적 방식)
  const fetchSuggestions = useCallback(async (selectedTags: string[]) => {
    if (selectedTags.length === 0) {
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch("/api/profile/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTags,
          existingTags: [...DEFAULT_HOBBY_TAGS, ...selectedTags],
          count: 5,
        }),
      });

      if (!response.ok) {
        console.error("Tag suggestion failed:", response.status);
        return;
      }

      const data = await response.json();
      if (data.success && data.data?.tags) {
        setSuggestedTags((prev) => {
          // 기존 추천 태그 + 새로운 태그 (중복 제외)
          const existingSet = new Set([...DEFAULT_HOBBY_TAGS, ...prev]);
          const newTags = data.data.tags.filter(
            (tag: string) => !existingSet.has(tag)
          );
          const combined = [...prev, ...newTags];
          // 최대 개수 제한
          return combined.slice(0, MAX_SUGGESTED_TAGS);
        });
      }
    } catch (error) {
      console.error("Failed to fetch tag suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // 취미 선택 변경 시 debounce로 추천 요청
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const selectedTags = Array.from(state.hobbies);

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(selectedTags);
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [state.hobbies, fetchSuggestions]);

  // 추천 태그 클릭 시 선택/해제 토글
  const toggleSuggestedTag = (tag: string) => {
    const newHobbies = new Set(state.hobbies);
    if (newHobbies.has(tag)) {
      // 이미 선택된 경우 해제
      newHobbies.delete(tag);
    } else if (newHobbies.size < MAX_HOBBIES) {
      // 선택되지 않은 경우 추가
      newHobbies.add(tag);
    }
    updateState({ hobbies: newHobbies });
  };

  const toggleHobby = (hobby: string) => {
    const newHobbies = new Set(state.hobbies);
    if (newHobbies.has(hobby)) {
      newHobbies.delete(hobby);
    } else if (newHobbies.size < MAX_HOBBIES) {
      newHobbies.add(hobby);
    }
    updateState({ hobbies: newHobbies });
  };

  const addCustomHobby = () => {
    const trimmed = customHobby.trim();
    if (trimmed && state.hobbies.size < MAX_HOBBIES && !state.hobbies.has(trimmed)) {
      const newHobbies = new Set(state.hobbies);
      newHobbies.add(trimmed);
      updateState({ hobbies: newHobbies });
      setCustomHobby("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomHobby();
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* 2열 레이아웃 */}
      <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16">
        {/* 왼쪽: 헤더 */}
        <motion.div variants={itemVariants} className="lg:w-1/3 mb-6 lg:mb-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 lg:mb-6">
              <span className="text-2xl lg:text-4xl">🎯</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
              취미와 관심사를 알려주세요
            </h2>
            <p className="text-white/70 text-sm lg:text-base max-w-sm">
              비슷한 취미를 가진 동료를 찾을 수 있어요. 최대 {MAX_HOBBIES}개까지 선택할 수 있어요.
            </p>

            {/* 선택된 취미 카운터 (데스크톱) */}
            <div className="hidden lg:block mt-6 p-4 bg-white/10 rounded-xl w-full">
              <p className="text-white/70 text-sm mb-1">선택된 취미</p>
              <p className="text-white font-bold text-2xl">{state.hobbies.size} / {MAX_HOBBIES}</p>
            </div>
          </div>
        </motion.div>

        {/* 오른쪽: 폼 */}
        <div className="lg:w-2/3">
          {/* 취미 태그 그리드 */}
          <motion.div variants={itemVariants} className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">
                취미 선택 <span className="lg:hidden">({state.hobbies.size}/{MAX_HOBBIES})</span>
              </span>
            </div>
            <motion.div
              variants={containerVariants}
              className="flex flex-wrap gap-2"
            >
              {DEFAULT_HOBBY_TAGS.map((hobby) => (
                <motion.div key={hobby} variants={itemVariants}>
                  <HobbyTag
                    tag={hobby}
                    isSelected={state.hobbies.has(hobby)}
                    onClick={() => toggleHobby(hobby)}
                    disabled={state.hobbies.size >= MAX_HOBBIES && !state.hobbies.has(hobby)}
                  />
                </motion.div>
              ))}

              {/* 로딩 인디케이터 */}
              <AnimatePresence>
                {isLoadingSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white/60"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>추천 태그 찾는 중...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 추천 태그 (누적됨) */}
              <AnimatePresence>
                {suggestedTags.map((tag) => (
                  <motion.div
                    key={`suggested-${tag}`}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HobbyTag
                      tag={tag}
                      isSelected={state.hobbies.has(tag)}
                      onClick={() => toggleSuggestedTag(tag)}
                      disabled={state.hobbies.size >= MAX_HOBBIES && !state.hobbies.has(tag)}
                      isSuggested={!state.hobbies.has(tag)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* 직접 입력 */}
          <motion.div variants={itemVariants} className="mb-5">
            <label className="text-white text-sm font-medium mb-2 block">직접 입력</label>
            <div className="flex gap-2">
              <Input
                value={customHobby}
                onChange={(e) => setCustomHobby(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="취미를 직접 입력..."
                disabled={state.hobbies.size >= MAX_HOBBIES}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
              />
              <Button
                type="button"
                onClick={addCustomHobby}
                disabled={!customHobby.trim() || state.hobbies.size >= MAX_HOBBIES}
                variant="ghost"
                className="h-12 text-white hover:bg-white/10 px-4"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* 2열 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {/* 관심 분야 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Heart className="w-4 h-4" />
                관심 분야
              </label>
              <Input
                value={state.interests}
                onChange={(e) => updateState({ interests: e.target.value })}
                placeholder="예: 스타트업, 투자, AI"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
              />
            </motion.div>

            {/* 좋아하는 음식 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Utensils className="w-4 h-4" />
                좋아하는 음식
              </label>
              <Input
                value={state.favoriteFood}
                onChange={(e) => updateState({ favoriteFood: e.target.value })}
                placeholder="예: 일식, 한식, 커피"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mt-8 lg:mt-10 pt-6 border-t border-white/10"
      >
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            onClick={onPrev}
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2 h-11 px-5"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            onClick={onNext}
            className="bg-white text-primary hover:bg-white/90 gap-2 h-11 px-8 rounded-full"
          >
            다음
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

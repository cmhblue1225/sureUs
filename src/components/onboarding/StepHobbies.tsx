"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, SkipForward, Heart, Utensils, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HobbyTag } from "./HobbyTag";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import { DEFAULT_HOBBY_TAGS, type StepProps } from "@/types/onboarding";

const MAX_HOBBIES = 10;

export function StepHobbies({
  state,
  updateState,
  onNext,
  onPrev,
  onSkip,
}: StepProps) {
  const [customHobby, setCustomHobby] = useState("");
  const hasAnyValue = state.hobbies.size > 0 || state.interests || state.favoriteFood;

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

        <div className="flex gap-2">
          <motion.div
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-white/70 hover:bg-white/10 gap-1 h-11 px-4"
            >
              건너뛰기
              <SkipForward className="w-4 h-4" />
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
              {hasAnyValue ? "다음" : "건너뛰고 다음"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

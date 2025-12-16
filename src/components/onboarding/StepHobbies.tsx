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
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-xl mx-auto"
    >
      {/* 헤더 */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎯</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          취미와 관심사를 알려주세요
        </h2>
        <p className="text-white/70">
          비슷한 취미를 가진 동료를 찾을 수 있어요
        </p>
      </motion.div>

      {/* 취미 태그 그리드 */}
      <motion.div variants={itemVariants} className="w-full mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-medium">
            취미 선택 ({state.hobbies.size}/{MAX_HOBBIES})
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
      <motion.div variants={itemVariants} className="w-full mb-4">
        <div className="flex gap-2">
          <Input
            value={customHobby}
            onChange={(e) => setCustomHobby(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="직접 입력..."
            disabled={state.hobbies.size >= MAX_HOBBIES}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          />
          <Button
            type="button"
            onClick={addCustomHobby}
            disabled={!customHobby.trim() || state.hobbies.size >= MAX_HOBBIES}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* 관심 분야 */}
      <motion.div variants={itemVariants} className="w-full mb-4">
        <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
          <Heart className="w-4 h-4" />
          관심 분야
        </label>
        <Input
          value={state.interests}
          onChange={(e) => updateState({ interests: e.target.value })}
          placeholder="예: 스타트업, 투자, AI, 건강"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
        />
      </motion.div>

      {/* 좋아하는 음식 */}
      <motion.div variants={itemVariants} className="w-full">
        <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
          <Utensils className="w-4 h-4" />
          좋아하는 음식
        </label>
        <Input
          value={state.favoriteFood}
          onChange={(e) => updateState({ favoriteFood: e.target.value })}
          placeholder="예: 일식, 한식, 고기, 커피"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
        />
      </motion.div>

      {/* 버튼 */}
      <motion.div
        variants={itemVariants}
        className="flex gap-3 mt-8 w-full"
      >
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            onClick={onPrev}
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2"
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
            onClick={onSkip}
            variant="ghost"
            className="text-white/70 hover:bg-white/10 gap-1"
          >
            건너뛰기
            <SkipForward className="w-4 h-4" />
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="flex-1"
        >
          <Button
            onClick={onNext}
            className="w-full bg-white text-primary hover:bg-white/90 gap-2"
          >
            {hasAnyValue ? "다음" : "건너뛰고 다음"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

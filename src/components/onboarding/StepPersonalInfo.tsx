"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, SkipForward, Calendar, MapPin, Home, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import type { StepProps } from "@/types/onboarding";

export function StepPersonalInfo({
  state,
  updateState,
  onNext,
  onPrev,
  onSkip,
}: StepProps) {
  const hasAnyValue = state.ageRange || state.livingLocation || state.hometown || state.education;

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-md mx-auto"
    >
      {/* 헤더 */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👤</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          개인 정보를 알려주세요
        </h2>
        <p className="text-white/70">
          모두 선택 사항이에요. 편하게 작성해주세요
        </p>
      </motion.div>

      {/* 폼 */}
      <motion.div
        variants={containerVariants}
        className="w-full space-y-4"
      >
        {/* 연령대 */}
        <motion.div variants={itemVariants}>
          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
            <Calendar className="w-4 h-4" />
            연령대
          </label>
          <Input
            value={state.ageRange}
            onChange={(e) => updateState({ ageRange: e.target.value })}
            placeholder="예: 20대 후반, 30대 초반"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          />
        </motion.div>

        {/* 사는 곳 */}
        <motion.div variants={itemVariants}>
          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
            <MapPin className="w-4 h-4" />
            사는 곳
          </label>
          <Input
            value={state.livingLocation}
            onChange={(e) => updateState({ livingLocation: e.target.value })}
            placeholder="예: 서울 강남구, 경기 성남시"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          />
        </motion.div>

        {/* 고향 */}
        <motion.div variants={itemVariants}>
          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
            <Home className="w-4 h-4" />
            고향
          </label>
          <Input
            value={state.hometown}
            onChange={(e) => updateState({ hometown: e.target.value })}
            placeholder="예: 부산, 대구, 서울"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          />
        </motion.div>

        {/* 학교 */}
        <motion.div variants={itemVariants}>
          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
            <GraduationCap className="w-4 h-4" />
            학교
          </label>
          <Input
            value={state.education}
            onChange={(e) => updateState({ education: e.target.value })}
            placeholder="예: 서울대 컴퓨터공학과, 연세대 경영학과"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          />
        </motion.div>
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

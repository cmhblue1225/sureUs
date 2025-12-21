"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, MapPin, Home, GraduationCap } from "lucide-react";
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
      className="w-full"
    >
      {/* 2열 레이아웃 */}
      <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16">
        {/* 왼쪽: 헤더 */}
        <motion.div variants={itemVariants} className="lg:w-2/5 mb-6 lg:mb-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 lg:mb-6">
              <span className="text-2xl lg:text-4xl">👤</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
              개인 정보를 알려주세요
            </h2>
            <p className="text-white/70 text-sm lg:text-base max-w-sm">
              모두 선택 사항이에요. 비슷한 배경의 동료를 찾는 데 도움이 됩니다.
            </p>
          </div>
        </motion.div>

        {/* 오른쪽: 폼 */}
        <div className="lg:w-3/5">
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5"
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
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
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
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
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
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
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
                placeholder="예: 서울대 컴퓨터공학과"
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
              />
            </motion.div>
          </motion.div>
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

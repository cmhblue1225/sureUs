"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, SkipForward, FileText, Code, Award, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LLMAssistButton } from "@/components/profile/LLMAssistButton";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import type { StepProps } from "@/types/onboarding";

export function StepWorkInfo({
  state,
  updateState,
  onNext,
  onPrev,
  onSkip,
}: StepProps) {
  const hasAnyValue = state.workDescription || state.techStack || state.certifications || state.languages;

  // LLM 도움 결과 적용
  const handleWorkDescriptionSuggestion = (text: string) => {
    updateState({ workDescription: text });
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
        <motion.div variants={itemVariants} className="lg:w-2/5 mb-6 lg:mb-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 lg:mb-6">
              <span className="text-2xl lg:text-4xl">💼</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
              업무에 대해 알려주세요
            </h2>
            <p className="text-white/70 text-sm lg:text-base max-w-sm">
              모두 선택 사항이에요. 비슷한 업무를 하는 동료를 찾는 데 도움이 됩니다.
            </p>
          </div>
        </motion.div>

        {/* 오른쪽: 폼 */}
        <div className="lg:w-3/5">
          <motion.div
            variants={containerVariants}
            className="space-y-4 lg:space-y-5"
          >
            {/* 부서에서 하는 일 */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  부서에서 하는 일
                </label>
                <LLMAssistButton
                  fieldType="workDescription"
                  onSuggestion={handleWorkDescriptionSuggestion}
                  additionalContext={{
                    department: state.department,
                    jobRole: state.jobRole,
                  }}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                />
              </div>
              <Textarea
                value={state.workDescription}
                onChange={(e) => updateState({ workDescription: e.target.value })}
                placeholder="어떤 업무를 담당하고 계신가요?"
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none rounded-xl"
              />
            </motion.div>

            {/* 2열 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {/* 기술 스택 */}
              <motion.div variants={itemVariants}>
                <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                  <Code className="w-4 h-4" />
                  기술 스택
                </label>
                <Input
                  value={state.techStack}
                  onChange={(e) => updateState({ techStack: e.target.value })}
                  placeholder="예: React, TypeScript"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
                />
              </motion.div>

              {/* 자격증 */}
              <motion.div variants={itemVariants}>
                <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                  <Award className="w-4 h-4" />
                  자격증
                </label>
                <Input
                  value={state.certifications}
                  onChange={(e) => updateState({ certifications: e.target.value })}
                  placeholder="예: 정보처리기사, AWS SAA"
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 rounded-xl"
                />
              </motion.div>
            </div>

            {/* 언어 능력 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Languages className="w-4 h-4" />
                언어 능력
              </label>
              <Input
                value={state.languages}
                onChange={(e) => updateState({ languages: e.target.value })}
                placeholder="예: 영어 비즈니스, 일본어 기초"
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

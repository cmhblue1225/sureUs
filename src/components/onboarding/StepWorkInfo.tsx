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
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-md mx-auto"
    >
      {/* 헤더 */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">💼</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          업무에 대해 알려주세요
        </h2>
        <p className="text-white/70">
          모두 선택 사항이에요
        </p>
      </motion.div>

      {/* 폼 */}
      <motion.div
        variants={containerVariants}
        className="w-full space-y-4"
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
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none"
          />
        </motion.div>

        {/* 기술 스택 */}
        <motion.div variants={itemVariants}>
          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
            <Code className="w-4 h-4" />
            기술 스택
          </label>
          <Input
            value={state.techStack}
            onChange={(e) => updateState({ techStack: e.target.value })}
            placeholder="예: React, TypeScript, Node.js, Python"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
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
            placeholder="예: 정보처리기사, AWS SAA, SQLD"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
          />
        </motion.div>

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

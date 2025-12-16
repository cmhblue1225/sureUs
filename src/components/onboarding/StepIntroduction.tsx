"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, SkipForward, Handshake, Star, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LLMAssistButton } from "@/components/profile/LLMAssistButton";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import type { StepProps } from "@/types/onboarding";

export function StepIntroduction({
  state,
  updateState,
  onNext,
  onPrev,
  onSkip,
}: StepProps) {
  const hasAnyValue =
    state.collaborationStyle ||
    state.strengths ||
    state.preferredPeopleType ||
    state.careerGoals;

  // LLM 도움 컨텍스트
  const llmContext = {
    department: state.department,
    jobRole: state.jobRole,
    mbti: state.mbti,
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
              <span className="text-2xl lg:text-4xl">✍️</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
              자기소개를 작성해주세요
            </h2>
            <p className="text-white/70 text-sm lg:text-base max-w-sm">
              AI 도움을 받아 쉽게 작성할 수 있어요. 각 필드 옆의 버튼을 눌러보세요!
            </p>

            {/* 팁 (데스크톱) */}
            <div className="hidden lg:block mt-6 p-4 bg-white/10 rounded-xl w-full">
              <p className="text-white/80 text-sm">
                💡 <strong>Tip:</strong> AI 도움 버튼을 클릭하면 자동으로 내용을 생성해드려요
              </p>
            </div>
          </div>
        </motion.div>

        {/* 오른쪽: 폼 */}
        <div className="lg:w-2/3">
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5"
          >
            {/* 협업 스타일 */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <Handshake className="w-4 h-4" />
                  협업 스타일
                </label>
                <LLMAssistButton
                  fieldType="collaborationStyle"
                  onSuggestion={(text) => updateState({ collaborationStyle: text })}
                  additionalContext={llmContext}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                />
              </div>
              <Textarea
                value={state.collaborationStyle}
                onChange={(e) => updateState({ collaborationStyle: e.target.value })}
                placeholder="팀에서 어떤 방식으로 협업하시나요?"
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none rounded-xl"
              />
            </motion.div>

            {/* 나의 강점 */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <Star className="w-4 h-4" />
                  나의 강점
                </label>
                <LLMAssistButton
                  fieldType="strengths"
                  onSuggestion={(text) => updateState({ strengths: text })}
                  additionalContext={llmContext}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                />
              </div>
              <Textarea
                value={state.strengths}
                onChange={(e) => updateState({ strengths: e.target.value })}
                placeholder="업무에서 발휘되는 나의 강점은?"
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none rounded-xl"
              />
            </motion.div>

            {/* 선호하는 동료 */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <Users className="w-4 h-4" />
                  선호하는 동료 유형
                </label>
                <LLMAssistButton
                  fieldType="preferredPeopleType"
                  onSuggestion={(text) => updateState({ preferredPeopleType: text })}
                  additionalContext={llmContext}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                />
              </div>
              <Textarea
                value={state.preferredPeopleType}
                onChange={(e) => updateState({ preferredPeopleType: e.target.value })}
                placeholder="어떤 동료와 함께 일하고 싶으신가요?"
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none rounded-xl"
              />
            </motion.div>

            {/* 커리어 목표 */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-white text-sm font-medium">
                  <Target className="w-4 h-4" />
                  커리어 목표
                </label>
                <LLMAssistButton
                  fieldType="careerGoals"
                  onSuggestion={(text) => updateState({ careerGoals: text })}
                  additionalContext={llmContext}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                />
              </div>
              <Textarea
                value={state.careerGoals}
                onChange={(e) => updateState({ careerGoals: e.target.value })}
                placeholder="앞으로의 커리어 목표는?"
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none rounded-xl"
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
              {hasAnyValue ? "완료하기" : "건너뛰고 완료"}
              <Check className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-md mx-auto"
    >
      {/* 헤더 */}
      <motion.div variants={itemVariants} className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✍️</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          자기소개를 작성해주세요
        </h2>
        <p className="text-white/70">
          AI 도움을 받아 쉽게 작성할 수 있어요
        </p>
      </motion.div>

      {/* 폼 */}
      <motion.div
        variants={containerVariants}
        className="w-full space-y-4"
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
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none"
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
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none"
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
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none"
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
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 resize-none"
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
            {hasAnyValue ? "완료하기" : "건너뛰고 완료"}
            <Check className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MbtiCard } from "./MbtiCard";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import { MBTI_TYPES, type StepProps, type MbtiType } from "@/types/onboarding";

export function StepMbti({
  state,
  updateState,
  onNext,
  onPrev,
  onSkip,
}: StepProps) {
  const handleSelect = (mbti: MbtiType) => {
    updateState({ mbti: state.mbti === mbti ? "" : mbti });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-xl mx-auto"
    >
      {/* 헤더 */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🧠</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          당신의 MBTI는?
        </h2>
        <p className="text-white/70">
          선택 사항이에요. 건너뛰어도 괜찮아요!
        </p>
      </motion.div>

      {/* MBTI 그리드 */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-4 gap-2 md:gap-3 w-full"
      >
        {MBTI_TYPES.map((mbti) => (
          <motion.div key={mbti} variants={itemVariants}>
            <MbtiCard
              type={mbti}
              isSelected={state.mbti === mbti}
              onClick={() => handleSelect(mbti)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* 선택된 MBTI 표시 */}
      {state.mbti && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/80 mt-4 text-center"
        >
          선택: <span className="font-bold text-white">{state.mbti}</span>
        </motion.p>
      )}

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
            다음
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

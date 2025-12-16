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
      className="w-full"
    >
      {/* 2열 레이아웃 */}
      <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16">
        {/* 왼쪽: 헤더 */}
        <motion.div variants={itemVariants} className="lg:w-1/3 mb-6 lg:mb-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 lg:mb-6">
              <span className="text-2xl lg:text-4xl">🧠</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
              당신의 MBTI는?
            </h2>
            <p className="text-white/70 text-sm lg:text-base max-w-sm">
              선택 사항이에요. 성격 유형을 기반으로 더 잘 맞는 동료를 찾을 수 있어요.
            </p>

            {/* 선택된 MBTI 표시 (데스크톱) */}
            {state.mbti && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden lg:block mt-6 p-4 bg-white/10 rounded-xl"
              >
                <p className="text-white/70 text-sm">선택됨</p>
                <p className="text-white font-bold text-2xl">{state.mbti}</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* 오른쪽: MBTI 그리드 */}
        <div className="lg:w-2/3">
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-4 gap-2 lg:gap-3"
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

          {/* 선택된 MBTI 표시 (모바일) */}
          {state.mbti && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden text-white/80 mt-4 text-center"
            >
              선택: <span className="font-bold text-white">{state.mbti}</span>
            </motion.p>
          )}
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
              다음
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

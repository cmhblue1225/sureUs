"use client";

import { motion } from "framer-motion";
import { TOTAL_PROGRESS_STEPS, type OnboardingStep } from "@/types/onboarding";

interface ProgressBarProps {
  currentStep: OnboardingStep;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  // Step 0 (Intro), Step 7 (Complete)은 진행률에서 제외
  // 실제 진행률은 Step 1-6 (6단계)
  const progressStep = Math.max(0, Math.min(currentStep - 1, TOTAL_PROGRESS_STEPS));
  const progress = (progressStep / TOTAL_PROGRESS_STEPS) * 100;

  // Intro (step 0)에서는 진행률 바 숨김
  if (currentStep === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* 배경 바 */}
      <div className="h-1 bg-white/10">
        {/* 진행률 바 */}
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* 단계 표시 */}
      <div className="absolute top-3 right-4">
        <motion.span
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-white/80 font-medium"
        >
          {currentStep === 7 ? "완료!" : `${progressStep} / ${TOTAL_PROGRESS_STEPS}`}
        </motion.span>
      </div>
    </div>
  );
}

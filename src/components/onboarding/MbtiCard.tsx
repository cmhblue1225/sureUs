"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { selectableCardVariants, checkmarkVariants } from "@/lib/animations";
import { MBTI_DESCRIPTIONS, type MbtiType } from "@/types/onboarding";
import { cn } from "@/lib/utils/cn";

interface MbtiCardProps {
  type: MbtiType;
  isSelected: boolean;
  onClick: () => void;
}

export function MbtiCard({ type, isSelected, onClick }: MbtiCardProps) {
  const description = MBTI_DESCRIPTIONS[type];

  return (
    <motion.button
      variants={selectableCardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        "relative p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-colors",
        "flex flex-col items-center justify-center gap-1",
        "min-h-[70px] lg:min-h-[90px] w-full",
        isSelected
          ? "bg-white/25 border-white shadow-lg"
          : "bg-white/10 border-white/20 hover:bg-white/15"
      )}
    >
      {/* 체크마크 */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MBTI 타입 */}
      <span
        className={cn(
          "text-base lg:text-lg font-bold transition-colors",
          isSelected ? "text-white" : "text-white/90"
        )}
      >
        {type}
      </span>

      {/* 설명 */}
      <span
        className={cn(
          "text-[10px] lg:text-xs transition-colors",
          isSelected ? "text-white/90" : "text-white/60"
        )}
      >
        {description}
      </span>
    </motion.button>
  );
}

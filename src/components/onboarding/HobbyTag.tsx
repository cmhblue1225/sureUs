"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { selectableCardVariants, checkmarkVariants } from "@/lib/animations";
import { cn } from "@/lib/utils/cn";

interface HobbyTagProps {
  tag: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function HobbyTag({ tag, isSelected, onClick, disabled }: HobbyTagProps) {
  return (
    <motion.button
      variants={selectableCardVariants}
      whileHover={!disabled ? "hover" : undefined}
      whileTap={!disabled ? "tap" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative px-4 py-2 rounded-full border-2 transition-colors",
        "flex items-center gap-1.5",
        "text-sm font-medium",
        isSelected
          ? "bg-white/25 border-white text-white"
          : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15",
        disabled && !isSelected && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* 아이콘 */}
      <AnimatePresence mode="wait">
        {isSelected ? (
          <motion.div
            key="check"
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Check className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="plus"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
          >
            <Plus className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {tag}
    </motion.button>
  );
}

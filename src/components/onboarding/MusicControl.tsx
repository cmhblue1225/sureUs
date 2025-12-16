"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MusicControlProps {
  isPlaying: boolean;
  isMuted: boolean;
  onToggle: () => void;
  onToggleMute: () => void;
  className?: string;
}

export function MusicControl({
  isPlaying,
  isMuted,
  onToggle,
  onToggleMute,
  className,
}: MusicControlProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2",
        className
      )}
    >
      {/* 음악 재생 상태 표시 */}
      <AnimatePresence>
        {isPlaying && !isMuted && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
          >
            {/* 음파 애니메이션 */}
            <div className="flex items-center gap-0.5 h-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-white rounded-full"
                  animate={{
                    height: ["8px", "16px", "8px"],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <span className="text-white/80 text-xs font-medium">재생 중</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컨트롤 버튼들 */}
      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full border border-white/20 overflow-hidden">
        {/* 재생/일시정지 버튼 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className={cn(
            "w-10 h-10 flex items-center justify-center transition-colors",
            isPlaying
              ? "text-white"
              : "text-white/60 hover:text-white"
          )}
          title={isPlaying ? "음악 일시정지" : "음악 재생"}
        >
          <Music className="w-4 h-4" />
        </motion.button>

        {/* 구분선 */}
        <div className="w-px h-5 bg-white/20" />

        {/* 음소거 버튼 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleMute}
          className={cn(
            "w-10 h-10 flex items-center justify-center transition-colors",
            isMuted
              ? "text-white/60 hover:text-white"
              : "text-white"
          )}
          title={isMuted ? "음소거 해제" : "음소거"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

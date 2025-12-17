"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface AudioConsentModalProps {
  isOpen: boolean;
  userName: string;
  onStart: () => void;
}

export function AudioConsentModal({
  isOpen,
  userName,
  onStart,
}: AudioConsentModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/50" />

          {/* 모달 카드 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="relative z-10 w-full max-w-sm"
          >
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-8">
              {/* 메시지 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <p className="text-white/60 text-sm mb-2">Welcome</p>
                <p className="text-white text-xl font-medium leading-relaxed">
                  <span className="font-semibold">{userName}</span>님을 더욱 자세히
                  <br />
                  알기 위해 온보딩을 시작할게요
                </p>
              </motion.div>

              {/* 시작 버튼 */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onStart}
                className="w-full py-3.5 bg-white text-gray-900 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/95 transition-colors"
              >
                시작하기
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

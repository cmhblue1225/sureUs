"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Sparkles, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  containerVariants,
  itemVariants,
  buttonVariants,
  celebrationVariants,
} from "@/lib/animations";

interface StepWelcomeProps {
  onNext: () => void;
  onStartMusic?: () => void;
}

export function StepWelcome({ onNext, onStartMusic }: StepWelcomeProps) {
  const handleStart = () => {
    onStartMusic?.();
    onNext();
  };
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full h-full flex flex-col items-center justify-center text-center px-6 sm:px-8 lg:px-16 py-8"
    >
      {/* 아이콘 */}
      <motion.div variants={celebrationVariants} className="mb-4 lg:mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <span className="text-3xl sm:text-4xl lg:text-5xl">👋</span>
        </div>
      </motion.div>

      {/* 환영 메시지 */}
      <motion.h1
        variants={itemVariants}
        className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 lg:mb-3"
      >
        환영합니다!
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-base sm:text-lg lg:text-xl xl:text-2xl text-white/80 mb-6 lg:mb-10 max-w-2xl"
      >
        sureNet에서 나와 맞는 동료를 찾아보세요
      </motion.p>

      {/* 서비스 소개 카드들 - PC에서 가로로 넓게 */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-8 mb-8 lg:mb-12 w-full max-w-5xl xl:max-w-6xl px-2"
      >
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 lg:mb-4">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
          </div>
          <h3 className="text-white font-semibold text-sm sm:text-base lg:text-xl mb-1 lg:mb-2">
            동료 발견
          </h3>
          <p className="text-white/70 text-xs sm:text-sm lg:text-base">
            비슷한 관심사를 가진 동료를 찾아보세요
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 lg:mb-4">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
          </div>
          <h3 className="text-white font-semibold text-sm sm:text-base lg:text-xl mb-1 lg:mb-2">
            AI 매칭
          </h3>
          <p className="text-white/70 text-xs sm:text-sm lg:text-base">
            AI가 최적의 네트워킹 상대를 추천해드려요
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 hover:bg-white/15 transition-colors"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 lg:mb-4">
            <Network className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
          </div>
          <h3 className="text-white font-semibold text-sm sm:text-base lg:text-xl mb-1 lg:mb-2">
            네트워크 확장
          </h3>
          <p className="text-white/70 text-xs sm:text-sm lg:text-base">
            사내 인맥을 넓히고 협업 기회를 만드세요
          </p>
        </motion.div>
      </motion.div>

      {/* 시작 버튼 */}
      <motion.div variants={itemVariants}>
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 gap-2 px-8 sm:px-10 lg:px-14 py-5 sm:py-6 lg:py-7 text-sm sm:text-base lg:text-lg rounded-full shadow-xl hover:shadow-2xl transition-shadow"
          >
            시작하기
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </Button>
        </motion.div>
      </motion.div>

      {/* 시간 안내 */}
      <motion.p
        variants={itemVariants}
        className="text-white/60 text-xs sm:text-sm lg:text-base mt-4 lg:mt-6"
      >
        약 2-3분 정도 소요됩니다
      </motion.p>
    </motion.div>
  );
}

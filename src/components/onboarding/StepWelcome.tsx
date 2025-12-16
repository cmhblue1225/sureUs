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
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      {/* 아이콘 */}
      <motion.div
        variants={celebrationVariants}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-5xl">👋</span>
        </div>
      </motion.div>

      {/* 환영 메시지 */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl md:text-5xl font-bold text-white mb-4"
      >
        환영합니다!
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-xl text-white/80 mb-8 max-w-md"
      >
        sureNet에서 나와 맞는 동료를 찾아보세요
      </motion.p>

      {/* 서비스 소개 카드들 */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-2xl w-full"
      >
        <motion.div
          variants={itemVariants}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <Users className="w-8 h-8 text-white mb-3 mx-auto" />
          <h3 className="text-white font-semibold mb-1">동료 발견</h3>
          <p className="text-white/70 text-sm">비슷한 관심사를 가진 동료를 찾아보세요</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <Sparkles className="w-8 h-8 text-white mb-3 mx-auto" />
          <h3 className="text-white font-semibold mb-1">AI 매칭</h3>
          <p className="text-white/70 text-sm">AI가 최적의 네트워킹 상대를 추천해드려요</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
        >
          <Network className="w-8 h-8 text-white mb-3 mx-auto" />
          <h3 className="text-white font-semibold mb-1">네트워크 확장</h3>
          <p className="text-white/70 text-sm">사내 인맥을 넓히고 협업 기회를 만드세요</p>
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
            onClick={onNext}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 gap-2 px-8 py-6 text-lg rounded-full shadow-lg"
          >
            시작하기
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>

      {/* 시간 안내 */}
      <motion.p
        variants={itemVariants}
        className="text-white/60 text-sm mt-6"
      >
        약 2-3분 정도 소요됩니다
      </motion.p>
    </motion.div>
  );
}

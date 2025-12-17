"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, Sparkles, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  introTextVariants,
  introContainerVariants,
  sloganVariants,
  featureCardVariants,
  featureContainerVariants,
  buttonVariants,
} from "@/lib/animations";

interface StepIntroProps {
  userName: string;
  onNext: () => void;
  onStartMusic?: () => void;
}

type Phase = 1 | 2 | 3;

export function StepIntro({ userName, onNext, onStartMusic }: StepIntroProps) {
  const [phase, setPhase] = useState<Phase>(1);

  // 자동 phase 전환
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(2), 3000);
    const timer2 = setTimeout(() => setPhase(3), 6000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleStart = () => {
    onStartMusic?.();
    onNext();
  };

  // 글자 하나씩 애니메이션
  const AnimatedText = ({ text, className }: { text: string; className?: string }) => (
    <motion.span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
            ease: "easeOut",
          }}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );

  return (
    <div className="w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        {/* Phase 1: 인사 */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            variants={introContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div variants={introTextVariants} className="mb-4">
              <span className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white">
                <AnimatedText text={`${userName} 님`} />
              </span>
            </motion.div>

            <motion.h1
              variants={introTextVariants}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6"
            >
              안녕하세요!
            </motion.h1>

            <motion.p
              variants={introTextVariants}
              className="text-2xl sm:text-3xl lg:text-4xl text-white/90 font-medium"
            >
              반가워요!
            </motion.p>
          </motion.div>
        )}

        {/* Phase 2: 슬로건 */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            variants={sloganVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center justify-center text-center px-6"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl sm:text-2xl lg:text-3xl text-white/80 mb-4"
            >
              관계를 이해하는 새로운 방식.
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold"
            >
              <span className="text-white">sure</span>
              <span className="text-white/90">Us</span>
              <span className="text-white/80 font-normal"> 입니다.</span>
            </motion.h1>
          </motion.div>
        )}

        {/* Phase 3: 핵심 기능 */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center px-6 w-full max-w-5xl"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 lg:mb-12"
            >
              sureUs로 이런 것들을 할 수 있어요
            </motion.h2>

            <motion.div
              variants={featureContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full mb-10 lg:mb-14"
            >
              {/* 기능 1: AI 동료 매칭 */}
              <motion.div
                variants={featureCardVariants}
                className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-5 lg:p-8 border border-white/20"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base lg:text-xl mb-2">
                  AI 동료 매칭
                </h3>
                <p className="text-white/70 text-sm lg:text-base">
                  AI가 나와 잘 맞는 동료를 추천해드려요
                </p>
              </motion.div>

              {/* 기능 2: 네트워크 시각화 */}
              <motion.div
                variants={featureCardVariants}
                className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-5 lg:p-8 border border-white/20"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Network className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base lg:text-xl mb-2">
                  네트워크 시각화
                </h3>
                <p className="text-white/70 text-sm lg:text-base">
                  사내 인맥을 한눈에 파악할 수 있어요
                </p>
              </motion.div>

              {/* 기능 3: 동호회 커뮤니티 */}
              <motion.div
                variants={featureCardVariants}
                className="bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-5 lg:p-8 border border-white/20"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base lg:text-xl mb-2">
                  동호회 커뮤니티
                </h3>
                <p className="text-white/70 text-sm lg:text-base">
                  관심사가 같은 동료들과 모임을 만들어요
                </p>
              </motion.div>
            </motion.div>

            {/* 시작하기 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 gap-2 px-10 lg:px-14 py-6 lg:py-7 text-base lg:text-lg rounded-full shadow-xl hover:shadow-2xl transition-shadow"
                >
                  시작하기
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

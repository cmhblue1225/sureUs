"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Edit, Building2, Briefcase, MapPin, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  containerVariants,
  itemVariants,
  buttonVariants,
  celebrationVariants,
} from "@/lib/animations";
import { MBTI_DESCRIPTIONS, type OnboardingState, type MbtiType } from "@/types/onboarding";

interface StepCompleteProps {
  state: OnboardingState;
  isLoading: boolean;
}

export function StepComplete({ state, isLoading }: StepCompleteProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  // 취미 태그 배열로 변환
  const hobbyTags = Array.from(state.hobbies).slice(0, 5);

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center text-center px-4 py-8 max-w-4xl mx-auto"
    >
      {/* 축하 아이콘 */}
      <motion.div variants={celebrationVariants} className="mb-6 lg:mb-8">
        <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <span className="text-4xl lg:text-6xl">🎊</span>
        </div>
      </motion.div>

      {/* 축하 메시지 */}
      <motion.h1
        variants={itemVariants}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3"
      >
        프로필 완성!
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-lg lg:text-xl text-white/80 mb-8 lg:mb-10"
      >
        이제 나와 맞는 동료를 찾아보세요
      </motion.p>

      {/* 프로필 미리보기 카드 */}
      <motion.div
        variants={itemVariants}
        className="w-full max-w-2xl bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-white/20 mb-8 lg:mb-10"
      >
        {/* 2열 그리드 (데스크톱) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-4">
          <div className="flex items-center gap-3 text-white p-3 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white/80" />
            </div>
            <div className="text-left">
              <span className="text-xs text-white/60 block">부서</span>
              <span className="font-medium">{state.department}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white p-3 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white/80" />
            </div>
            <div className="text-left">
              <span className="text-xs text-white/60 block">직군</span>
              <span className="font-medium">{state.jobRole}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white p-3 bg-white/5 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white/80" />
            </div>
            <div className="text-left">
              <span className="text-xs text-white/60 block">근무지</span>
              <span className="font-medium">{state.officeLocation}</span>
            </div>
          </div>

          {state.mbti && (
            <div className="flex items-center gap-3 text-white p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white/80" />
              </div>
              <div className="text-left">
                <span className="text-xs text-white/60 block">MBTI</span>
                <span className="font-medium">
                  {state.mbti}
                  <span className="text-white/60 text-sm ml-1">
                    ({MBTI_DESCRIPTIONS[state.mbti as MbtiType]})
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 취미 태그 */}
        {hobbyTags.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/60 mb-3 text-left">취미</p>
            <div className="flex flex-wrap gap-2">
              {hobbyTags.map((hobby) => (
                <Badge
                  key={hobby}
                  variant="secondary"
                  className="bg-white/20 text-white border-0 px-3 py-1"
                >
                  {hobby}
                </Badge>
              ))}
              {state.hobbies.size > 5 && (
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white/60 border-0 px-3 py-1"
                >
                  +{state.hobbies.size - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* 버튼 */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
      >
        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="flex-1"
        >
          <Button
            onClick={handleEditProfile}
            variant="ghost"
            className="w-full text-white hover:bg-white/10 gap-2 h-12 rounded-full"
          >
            <Edit className="w-4 h-4" />
            프로필 수정하기
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="flex-1"
        >
          <Button
            onClick={handleGoToDashboard}
            disabled={isLoading}
            className="w-full bg-white text-primary hover:bg-white/90 gap-2 h-12 rounded-full shadow-lg"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                대시보드로 이동
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* 안내 메시지 */}
      <motion.p
        variants={itemVariants}
        className="text-white/50 text-sm mt-6"
      >
        언제든지 프로필 설정에서 정보를 수정할 수 있어요
      </motion.p>
    </motion.div>
  );
}

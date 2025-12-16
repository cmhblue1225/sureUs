"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Edit, Building2, Briefcase, MapPin, Brain } from "lucide-react";
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
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-md mx-auto"
    >
      {/* 축하 아이콘 */}
      <motion.div variants={celebrationVariants} className="mb-6">
        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <span className="text-5xl">🎊</span>
        </div>
      </motion.div>

      {/* 축하 메시지 */}
      <motion.h1
        variants={itemVariants}
        className="text-3xl md:text-4xl font-bold text-white mb-2 text-center"
      >
        프로필 완성!
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-white/80 mb-8 text-center"
      >
        이제 나와 맞는 동료를 찾아보세요
      </motion.p>

      {/* 프로필 미리보기 카드 */}
      <motion.div
        variants={itemVariants}
        className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8"
      >
        {/* 기본 정보 */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-white">
            <Building2 className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">부서</span>
            <span className="font-medium">{state.department}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <Briefcase className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">직군</span>
            <span className="font-medium">{state.jobRole}</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">근무지</span>
            <span className="font-medium">{state.officeLocation}</span>
          </div>
          {state.mbti && (
            <div className="flex items-center gap-2 text-white">
              <Brain className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">MBTI</span>
              <span className="font-medium">
                {state.mbti}
                <span className="text-white/60 ml-1">
                  ({MBTI_DESCRIPTIONS[state.mbti as MbtiType]})
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 취미 태그 */}
        {hobbyTags.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/60 mb-2">취미</p>
            <div className="flex flex-wrap gap-1.5">
              {hobbyTags.map((hobby) => (
                <Badge
                  key={hobby}
                  variant="secondary"
                  className="bg-white/20 text-white border-0"
                >
                  {hobby}
                </Badge>
              ))}
              {state.hobbies.size > 5 && (
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white/60 border-0"
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
        className="flex flex-col sm:flex-row gap-3 w-full"
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
            className="w-full text-white hover:bg-white/10 gap-2"
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
            className="w-full bg-white text-primary hover:bg-white/90 gap-2"
          >
            대시보드로 이동
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* 안내 메시지 */}
      <motion.p
        variants={itemVariants}
        className="text-white/50 text-xs mt-6 text-center"
      >
        언제든지 프로필 설정에서 정보를 수정할 수 있어요
      </motion.p>
    </motion.div>
  );
}

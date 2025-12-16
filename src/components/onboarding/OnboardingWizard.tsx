"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import { StepWelcome } from "./StepWelcome";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepMbti } from "./StepMbti";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepWorkInfo } from "./StepWorkInfo";
import { StepHobbies } from "./StepHobbies";
import { StepIntroduction } from "./StepIntroduction";
import { StepComplete } from "./StepComplete";
import { pageVariants } from "@/lib/animations";
import {
  initialOnboardingState,
  type OnboardingState,
  type OnboardingStep,
} from "@/types/onboarding";

interface OnboardingWizardProps {
  userId: string;
}

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const [state, setState] = useState<OnboardingState>(initialOnboardingState);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // 상태 업데이트
  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 다음 단계로 이동
  const goNext = useCallback(() => {
    setDirection(1);
    setState((prev) => {
      const nextStep = Math.min(prev.currentStep + 1, 7) as OnboardingStep;

      // Step 6에서 7로 넘어갈 때 프로필 저장
      if (prev.currentStep === 6 && nextStep === 7) {
        saveProfile(prev);
      }

      return { ...prev, currentStep: nextStep };
    });
  }, []);

  // 이전 단계로 이동
  const goPrev = useCallback(() => {
    setDirection(-1);
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0) as OnboardingStep,
    }));
  }, []);

  // 건너뛰기 (다음으로 이동)
  const onSkip = useCallback(() => {
    goNext();
  }, [goNext]);

  // 프로필 저장
  const saveProfile = async (currentState: OnboardingState) => {
    setIsLoading(true);
    try {
      // 취미를 배열로 변환
      const hobbiesArray = Array.from(currentState.hobbies);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 기본 정보 (필수)
          department: currentState.department,
          job_role: currentState.jobRole,
          office_location: currentState.officeLocation,

          // MBTI
          mbti: currentState.mbti || null,

          // 개인 정보
          age_range: currentState.ageRange || null,
          living_location: currentState.livingLocation || null,
          hometown: currentState.hometown || null,
          education: currentState.education || null,

          // 업무 정보
          work_description: currentState.workDescription || null,
          tech_stack: currentState.techStack || null,
          certifications: currentState.certifications || null,
          languages: currentState.languages || null,

          // 취미/관심사
          interests: currentState.interests || null,
          favorite_food: currentState.favoriteFood || null,

          // 자기소개
          collaboration_style: currentState.collaborationStyle || null,
          strengths: currentState.strengths || null,
          preferred_people_type: currentState.preferredPeopleType || null,
          career_goals: currentState.careerGoals || null,

          // 취미 태그는 별도 처리
          hobby_tags: hobbiesArray,

          // 온보딩 완료 플래그
          onboarding_completed: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Profile save error:", error);
      }
    } catch (error) {
      console.error("Profile save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 단계에 따른 컴포넌트 렌더링
  const renderStep = () => {
    const commonProps = {
      state,
      updateState,
      onNext: goNext,
      onPrev: goPrev,
      onSkip,
    };

    switch (state.currentStep) {
      case 0:
        return <StepWelcome onNext={goNext} />;
      case 1:
        return <StepBasicInfo {...commonProps} />;
      case 2:
        return <StepMbti {...commonProps} />;
      case 3:
        return <StepPersonalInfo {...commonProps} />;
      case 4:
        return <StepWorkInfo {...commonProps} />;
      case 5:
        return <StepHobbies {...commonProps} />;
      case 6:
        return <StepIntroduction {...commonProps} />;
      case 7:
        return <StepComplete state={state} isLoading={isLoading} />;
      default:
        return null;
    }
  };

  // 애니메이션 variants (방향에 따라)
  const variants: Variants = {
    initial: (d: number) => ({
      opacity: 0,
      x: d > 0 ? 50 : -50,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
    exit: (d: number) => ({
      opacity: 0,
      x: d > 0 ? -50 : 50,
      transition: {
        duration: 0.2,
        ease: "easeIn" as const,
      },
    }),
  };

  return (
    <div className="min-h-screen onboarding-bg">
      {/* 진행률 바 */}
      <ProgressBar currentStep={state.currentStep} />

      {/* 단계 컨텐츠 */}
      <div className="container mx-auto py-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={state.currentStep}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

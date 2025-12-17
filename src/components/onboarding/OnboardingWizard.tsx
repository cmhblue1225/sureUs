"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import { StepIntro } from "./StepIntro";
import { StepWelcome } from "./StepWelcome";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepMbti } from "./StepMbti";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepWorkInfo } from "./StepWorkInfo";
import { StepHobbies } from "./StepHobbies";
import { StepIntroduction } from "./StepIntroduction";
import { StepComplete } from "./StepComplete";
import { MusicControl } from "./MusicControl";
import { AudioConsentModal } from "./AudioConsentModal";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import {
  initialOnboardingState,
  type OnboardingState,
  type OnboardingStep,
} from "@/types/onboarding";

interface OnboardingWizardProps {
  userId: string;
  userName: string;
}

export function OnboardingWizard({ userId, userName }: OnboardingWizardProps) {
  const [state, setState] = useState<OnboardingState>(initialOnboardingState);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showAudioModal, setShowAudioModal] = useState(true);

  // 배경음악 훅
  const {
    isPlaying,
    isMuted,
    play: playMusic,
    toggle: toggleMusic,
    toggleMute,
  } = useBackgroundMusic({
    src: "/sounds/onboarding-bgm.mp3",
    volume: 0.3,
    loop: true,
  });

  // 오디오 모달 핸들러 - 시작 버튼 클릭 시 음악 재생 + 모달 닫기
  const handleOnboardingStart = useCallback(() => {
    playMusic();
    setShowAudioModal(false);
  }, [playMusic]);

  // 상태 업데이트
  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 다음 단계로 이동
  const goNext = useCallback(() => {
    setDirection(1);
    setState((prev) => {
      const nextStep = Math.min(prev.currentStep + 1, 8) as OnboardingStep;

      // Step 7에서 8로 넘어갈 때 프로필 저장
      if (prev.currentStep === 7 && nextStep === 8) {
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
        return <StepIntro userName={userName} onNext={goNext} onStartMusic={playMusic} />;
      case 1:
        return <StepWelcome onNext={goNext} />;
      case 2:
        return <StepBasicInfo {...commonProps} />;
      case 3:
        return <StepMbti {...commonProps} />;
      case 4:
        return <StepPersonalInfo {...commonProps} />;
      case 5:
        return <StepWorkInfo {...commonProps} />;
      case 6:
        return <StepHobbies {...commonProps} />;
      case 7:
        return <StepIntroduction {...commonProps} />;
      case 8:
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

  // Intro, Welcome, Complete 화면에서는 카드 없이 전체 화면 사용
  const isFullScreen = state.currentStep === 0 || state.currentStep === 1 || state.currentStep === 8;

  return (
    <div className="min-h-screen h-screen onboarding-bg overflow-hidden">
      {/* 온보딩 시작 모달 */}
      <AudioConsentModal
        isOpen={showAudioModal}
        userName={userName}
        onStart={handleOnboardingStart}
      />

      {/* 모달이 닫힌 후에만 온보딩 UI 표시 */}
      {!showAudioModal && (
        <>
          {/* 진행률 바 */}
          <ProgressBar currentStep={state.currentStep} />

          {/* 배경음악 컨트롤 */}
          <MusicControl
            isPlaying={isPlaying}
            isMuted={isMuted}
            onToggle={toggleMusic}
            onToggleMute={toggleMute}
          />

          {/* 단계 컨텐츠 */}
          <div className="h-full flex items-center justify-center px-4 py-8 lg:py-12">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={state.currentStep}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={
                  isFullScreen
                    ? "w-full h-full flex items-center justify-center"
                    : "w-full max-w-4xl"
                }
              >
                {isFullScreen ? (
                  renderStep()
                ) : (
                  // Glass morphism 카드 래퍼
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
                  >
                    <div className="p-6 sm:p-8 lg:p-12 max-h-[85vh] overflow-y-auto custom-scrollbar">
                      {renderStep()}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Award, MapPin, Building2, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import {
  ORG_LEVEL1_OPTIONS,
  getOrgLevel2Options,
  getOrgLevel3Options,
  hasLevel2,
  hasLevel3,
  getFullOrgPath,
} from "@/lib/constants/organization";
import { JOB_POSITIONS } from "@/lib/constants/jobPositions";
import { OFFICE_LOCATIONS } from "@/lib/constants/locations";
import type { StepProps } from "@/types/onboarding";

export function StepBasicInfo({
  state,
  updateState,
  onNext,
  onPrev,
}: StepProps) {
  // 필수 필드: orgLevel1, jobPosition, officeLocation
  const isValid = state.orgLevel1 && state.jobPosition && state.officeLocation;

  const level2Options = state.orgLevel1 ? getOrgLevel2Options(state.orgLevel1) : [];
  const level3Options = state.orgLevel1 && state.orgLevel2 ? getOrgLevel3Options(state.orgLevel1, state.orgLevel2) : [];

  const hasLevel2Options = state.orgLevel1 ? hasLevel2(state.orgLevel1) : false;
  const hasLevel3Options = state.orgLevel1 && state.orgLevel2 ? hasLevel3(state.orgLevel1, state.orgLevel2) : false;

  const fullOrgPath = getFullOrgPath(state.orgLevel1, state.orgLevel2, state.orgLevel3);

  const handleLevel1Change = (value: string) => {
    updateState({
      orgLevel1: value,
      orgLevel2: "",
      orgLevel3: "",
      // department는 전체 경로로 자동 계산
      department: value,
    });
  };

  const handleLevel2Change = (value: string) => {
    updateState({
      orgLevel2: value,
      orgLevel3: "",
      department: getFullOrgPath(state.orgLevel1, value, ""),
    });
  };

  const handleLevel3Change = (value: string) => {
    updateState({
      orgLevel3: value,
      department: getFullOrgPath(state.orgLevel1, state.orgLevel2, value),
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full"
    >
      {/* 2열 레이아웃: 왼쪽 헤더, 오른쪽 폼 */}
      <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16">
        {/* 왼쪽: 헤더 */}
        <motion.div variants={itemVariants} className="lg:w-2/5 mb-6 lg:mb-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 lg:mb-6">
              <span className="text-2xl lg:text-4xl">📋</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
              기본 정보를 알려주세요
            </h2>
            <p className="text-white/70 text-sm lg:text-base max-w-sm">
              회사에서의 소속과 직급을 입력해주세요. 이 정보는 동료 매칭에 활용됩니다.
            </p>
          </div>
        </motion.div>

        {/* 오른쪽: 폼 */}
        <div className="lg:w-3/5">
          <motion.div
            variants={containerVariants}
            className="space-y-5 lg:space-y-6"
          >
            {/* Level 1: 연구소/센터/본부 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Building2 className="w-4 h-4" />
                연구소/센터/본부 <span className="text-red-300">*</span>
              </label>
              <Select
                value={state.orgLevel1}
                onValueChange={handleLevel1Change}
              >
                <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl">
                  <SelectValue placeholder="소속을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_LEVEL1_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Level 2: 실 */}
            {hasLevel2Options && (
              <motion.div variants={itemVariants}>
                <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                  <Users className="w-4 h-4" />
                  실
                </label>
                <Select
                  value={state.orgLevel2}
                  onValueChange={handleLevel2Change}
                  disabled={!state.orgLevel1}
                >
                  <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl disabled:opacity-50">
                    <SelectValue placeholder="실을 선택해주세요 (선택)" />
                  </SelectTrigger>
                  <SelectContent>
                    {level2Options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Level 3: 팀 */}
            {hasLevel3Options && (
              <motion.div variants={itemVariants}>
                <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                  <Briefcase className="w-4 h-4" />
                  팀
                </label>
                <Select
                  value={state.orgLevel3}
                  onValueChange={handleLevel3Change}
                  disabled={!state.orgLevel2}
                >
                  <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl disabled:opacity-50">
                    <SelectValue placeholder="팀을 선택해주세요 (선택)" />
                  </SelectTrigger>
                  <SelectContent>
                    {level3Options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* 선택된 소속 경로 표시 */}
            {fullOrgPath && (
              <motion.div
                variants={itemVariants}
                className="px-4 py-3 bg-white/10 rounded-xl"
              >
                <p className="text-white/60 text-xs mb-1">선택된 소속</p>
                <p className="text-white font-medium">{fullOrgPath}</p>
              </motion.div>
            )}

            {/* 직급 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Award className="w-4 h-4" />
                직급 <span className="text-red-300">*</span>
              </label>
              <Select
                value={state.jobPosition}
                onValueChange={(value) => updateState({ jobPosition: value })}
              >
                <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl">
                  <SelectValue placeholder="직급을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* 근무지 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <MapPin className="w-4 h-4" />
                근무지 <span className="text-red-300">*</span>
              </label>
              <Select
                value={state.officeLocation}
                onValueChange={(value) => updateState({ officeLocation: value })}
              >
                <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl">
                  <SelectValue placeholder="근무지를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {OFFICE_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          </motion.div>

          {/* 필수 안내 */}
          <motion.p
            variants={itemVariants}
            className="text-white/50 text-xs mt-4"
          >
            <span className="text-red-300">*</span> 표시는 필수 항목입니다
          </motion.p>
        </div>
      </div>

      {/* 버튼 */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mt-8 lg:mt-10 pt-6 border-t border-white/10"
      >
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            onClick={onPrev}
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2 h-11 px-5"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="bg-white text-primary hover:bg-white/90 gap-2 disabled:opacity-50 h-11 px-8 rounded-full"
          >
            다음
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

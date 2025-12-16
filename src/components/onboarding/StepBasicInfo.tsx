"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { containerVariants, itemVariants, buttonVariants } from "@/lib/animations";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { JOB_ROLES } from "@/lib/constants/jobRoles";
import { OFFICE_LOCATIONS } from "@/lib/constants/locations";
import type { StepProps } from "@/types/onboarding";

export function StepBasicInfo({
  state,
  updateState,
  onNext,
  onPrev,
}: StepProps) {
  const isValid = state.department && state.jobRole && state.officeLocation;

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
              회사에서의 기본 정보를 입력해주세요. 이 정보는 동료 매칭에 활용됩니다.
            </p>
          </div>
        </motion.div>

        {/* 오른쪽: 폼 */}
        <div className="lg:w-3/5">
          <motion.div
            variants={containerVariants}
            className="space-y-5 lg:space-y-6"
          >
            {/* 부서 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Building2 className="w-4 h-4" />
                부서 <span className="text-red-300">*</span>
              </label>
              <Select
                value={state.department}
                onValueChange={(value) => updateState({ department: value })}
              >
                <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl">
                  <SelectValue placeholder="부서를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* 직군 */}
            <motion.div variants={itemVariants}>
              <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                <Briefcase className="w-4 h-4" />
                직군 <span className="text-red-300">*</span>
              </label>
              <Select
                value={state.jobRole}
                onValueChange={(value) => updateState({ jobRole: value })}
              >
                <SelectTrigger className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30 rounded-xl">
                  <SelectValue placeholder="직군을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
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

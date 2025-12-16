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
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 w-full max-w-md mx-auto"
    >
      {/* 헤더 */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          기본 정보를 알려주세요
        </h2>
        <p className="text-white/70">
          회사에서의 기본 정보를 입력해주세요
        </p>
      </motion.div>

      {/* 폼 */}
      <motion.div
        variants={containerVariants}
        className="w-full space-y-4"
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
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30">
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
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30">
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
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/30">
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

      {/* 버튼 */}
      <motion.div
        variants={itemVariants}
        className="flex gap-3 mt-8 w-full"
      >
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            onClick={onPrev}
            variant="ghost"
            className="text-white hover:bg-white/10 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </Button>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          className="flex-1"
        >
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="w-full bg-white text-primary hover:bg-white/90 gap-2 disabled:opacity-50"
          >
            다음
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

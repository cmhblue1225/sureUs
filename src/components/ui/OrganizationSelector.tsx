"use client";

import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building2, Users, Briefcase } from "lucide-react";
import {
  ORG_LEVEL1_OPTIONS,
  getOrgLevel2Options,
  getOrgLevel3Options,
  hasLevel2,
  hasLevel3,
  getFullOrgPath,
} from "@/lib/constants/organization";

interface OrganizationSelectorProps {
  level1: string;
  level2: string;
  level3: string;
  onLevel1Change: (value: string) => void;
  onLevel2Change: (value: string) => void;
  onLevel3Change: (value: string) => void;
  disabled?: boolean;
  showPath?: boolean;
  className?: string;
}

export function OrganizationSelector({
  level1,
  level2,
  level3,
  onLevel1Change,
  onLevel2Change,
  onLevel3Change,
  disabled = false,
  showPath = true,
  className = "",
}: OrganizationSelectorProps) {
  const level2Options = level1 ? getOrgLevel2Options(level1) : [];
  const level3Options = level1 && level2 ? getOrgLevel3Options(level1, level2) : [];

  const hasLevel2Options = level1 ? hasLevel2(level1) : false;
  const hasLevel3Options = level1 && level2 ? hasLevel3(level1, level2) : false;

  // Level 1 변경 시 하위 레벨 초기화
  useEffect(() => {
    if (level1 && level2) {
      const validLevel2Options = getOrgLevel2Options(level1);
      if (!validLevel2Options.includes(level2)) {
        onLevel2Change("");
        onLevel3Change("");
      }
    }
  }, [level1, level2, onLevel2Change, onLevel3Change]);

  // Level 2 변경 시 Level 3 초기화
  useEffect(() => {
    if (level1 && level2 && level3) {
      const validLevel3Options = getOrgLevel3Options(level1, level2);
      if (!validLevel3Options.includes(level3)) {
        onLevel3Change("");
      }
    }
  }, [level1, level2, level3, onLevel3Change]);

  const fullPath = getFullOrgPath(level1, level2, level3);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Level 1: 연구소/센터/본부 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          연구소/센터/본부 <span className="text-destructive">*</span>
        </Label>
        <Select
          value={level1}
          onValueChange={(value) => {
            onLevel1Change(value);
            onLevel2Change("");
            onLevel3Change("");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full bg-white/10 border-white/20">
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
      </div>

      {/* Level 2: 실 */}
      {hasLevel2Options && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            실
          </Label>
          <Select
            value={level2}
            onValueChange={(value) => {
              onLevel2Change(value);
              onLevel3Change("");
            }}
            disabled={disabled || !level1}
          >
            <SelectTrigger className="w-full bg-white/10 border-white/20">
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
        </div>
      )}

      {/* Level 3: 팀 */}
      {hasLevel3Options && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            팀
          </Label>
          <Select
            value={level3}
            onValueChange={onLevel3Change}
            disabled={disabled || !level2}
          >
            <SelectTrigger className="w-full bg-white/10 border-white/20">
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
        </div>
      )}

      {/* 선택된 조직 경로 표시 */}
      {showPath && fullPath && (
        <div className="px-3 py-2 bg-primary/10 rounded-lg">
          <p className="text-xs text-muted-foreground">선택된 소속</p>
          <p className="text-sm font-medium text-primary">{fullPath}</p>
        </div>
      )}
    </div>
  );
}

export default OrganizationSelector;

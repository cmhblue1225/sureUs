"use client";

import { cn } from "@/lib/utils/cn";

/**
 * 기본 아바타 이미지 경로
 * 프로필 사진이 없는 사용자에게 표시됩니다.
 */
export const DEFAULT_AVATAR_URL = "/favicon.ico";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

/**
 * 사용자 아바타 컴포넌트
 * 프로필 사진이 없으면 기본 아바타(favicon.ico)를 표시합니다.
 */
export function UserAvatar({
  src,
  alt = "프로필",
  size = "md",
  className,
}: UserAvatarProps) {
  const avatarSrc = src || DEFAULT_AVATAR_URL;

  return (
    <img
      src={avatarSrc}
      alt={alt}
      className={cn(
        "rounded-full object-cover bg-muted",
        sizeClasses[size],
        className
      )}
    />
  );
}

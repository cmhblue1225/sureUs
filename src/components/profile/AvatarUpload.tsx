"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { User, Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onRemoveSuccess?: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const iconSizes = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-14 h-14",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUpload({
  currentAvatarUrl,
  onUploadSuccess,
  onRemoveSuccess,
  size = "md",
  disabled = false,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || currentAvatarUrl;

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 가능)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기가 5MB를 초과합니다.";
    }
    return null;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "업로드에 실패했습니다.");
      }

      // Update preview with actual URL
      setPreviewUrl(result.data.avatarUrl);
      onUploadSuccess?.(result.data.avatarUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!displayUrl || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/avatar", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "삭제에 실패했습니다.");
      }

      setPreviewUrl(null);
      onRemoveSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Avatar circle */}
        <div
          className={cn(
            "relative rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer transition-opacity",
            sizeClasses[size],
            disabled && "opacity-50 cursor-not-allowed",
            uploading && "opacity-70"
          )}
          onClick={handleClick}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="프로필 사진"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={cn("text-muted-foreground", iconSizes[size])} />
          )}

          {/* Overlay on hover */}
          {!disabled && !uploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Remove button */}
        {displayUrl && !uploading && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
            aria-label="프로필 사진 삭제"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        클릭하여 사진 업로드
        <br />
        (최대 5MB, JPEG/PNG/WebP)
      </p>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

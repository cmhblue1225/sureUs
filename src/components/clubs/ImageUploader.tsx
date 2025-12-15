"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageUploaderProps {
  clubId: string;
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  url?: string;
  error?: string;
}

export default function ImageUploader({
  clubId,
  onUploadComplete,
  maxFiles = 10,
  className,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles: UploadingFile[] = [];
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const maxSize = 20 * 1024 * 1024; // 20MB

      for (let i = 0; i < selectedFiles.length; i++) {
        if (files.length + newFiles.length >= maxFiles) break;

        const file = selectedFiles[i];

        if (!allowedTypes.includes(file.type)) {
          continue;
        }

        if (file.size > maxSize) {
          continue;
        }

        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "complete") {
        if (files[i].url) uploadedUrls.push(files[i].url!);
        continue;
      }

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading", progress: 0 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);

        const response = await fetch(`/api/clubs/${clubId}/images`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!result.success) {
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? { ...f, status: "error", error: result.error, progress: 0 }
                : f
            )
          );
          continue;
        }

        uploadedUrls.push(result.data.url);

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "complete", progress: 100, url: result.data.url }
              : f
          )
        );
      } catch (error) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error", error: "업로드 실패", progress: 0 }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
    }
  };

  const clearCompleted = () => {
    setFiles((prev) => {
      prev.forEach((f) => {
        if (f.status === "complete") {
          URL.revokeObjectURL(f.preview);
        }
      });
      return prev.filter((f) => f.status !== "complete");
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-1">
          이미지를 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP, GIF (최대 20MB, {maxFiles}개까지)
        </p>
      </div>

      {/* File Preview List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              선택된 파일 ({files.length}/{maxFiles})
            </span>
            {files.some((f) => f.status === "complete") && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                완료된 항목 제거
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-full object-cover"
                />

                {/* Status Overlay */}
                {file.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}

                {file.status === "complete" && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-1">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {file.status === "error" && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <span className="text-xs text-white px-2 text-center">
                      {file.error}
                    </span>
                  </div>
                )}

                {/* Remove Button */}
                {file.status !== "uploading" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                )}

                {/* Progress Bar */}
                {file.status === "uploading" && (
                  <div className="absolute bottom-0 left-0 right-0">
                    <Progress value={file.progress} className="h-1 rounded-none" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={uploadFiles}
              disabled={
                isUploading ||
                files.length === 0 ||
                files.every((f) => f.status === "complete")
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  업로드
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

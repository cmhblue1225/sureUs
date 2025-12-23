"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  all_day: boolean;
  event_type: "training" | "personal";
  user_id: string | null;
  created_by: string;
  location: string | null;
  color: string | null;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultDate?: Date | null;
  onSave: () => void;
  onDelete: () => void;
  userRole: "admin" | "user";
}

const colorOptions = [
  { value: "#3B82F6", label: "파랑" },
  { value: "#10B981", label: "초록" },
  { value: "#F59E0B", label: "노랑" },
  { value: "#EF4444", label: "빨강" },
  { value: "#8B5CF6", label: "보라" },
  { value: "#EC4899", label: "분홍" },
];

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSave,
  onDelete,
  userRole,
}: EventModalProps) {
  const isEditing = !!event;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<"training" | "personal">(
    "personal"
  );
  const [location, setLocation] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 초기화
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartDate(formatDateTimeLocal(event.start_date));
      setEndDate(formatDateTimeLocal(event.end_date));
      setAllDay(event.all_day);
      setEventType(event.event_type);
      setLocation(event.location || "");
      setColor(event.color || "#3B82F6");
    } else {
      // 새 이벤트 기본값 - defaultDate가 있으면 사용
      const baseDate = defaultDate || new Date();
      const startTime = new Date(baseDate);
      // defaultDate가 있으면 해당 날짜의 9시로 설정
      if (defaultDate) {
        startTime.setHours(9, 0, 0, 0);
      }
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      setTitle("");
      setDescription("");
      setStartDate(formatDateTimeLocal(startTime.toISOString()));
      setEndDate(formatDateTimeLocal(endTime.toISOString()));
      setAllDay(false);
      setEventType("personal");
      setLocation("");
      setColor("#3B82F6");
    }
  }, [event, defaultDate, isOpen]);

  function formatDateTimeLocal(dateStr: string): string {
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      const body = {
        title,
        description: description || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        allDay,
        eventType,
        location: location || null,
        color,
      };

      const url = isEditing ? `/api/calendar/${event.id}` : "/api/calendar";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        onSave();
      } else {
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/${event.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        onDelete();
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // 교육 일정은 admin만 생성/수정 가능
  const canCreateTraining = userRole === "admin";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "일정 수정" : "새 일정 추가"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEditing ? "선택한 일정을 수정합니다." : "새로운 일정을 추가합니다."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="일정 제목"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">일정 유형 *</Label>
              <Select
                value={eventType}
                onValueChange={(v) =>
                  setEventType(v as "training" | "personal")
                }
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">개인 일정</SelectItem>
                  {canCreateTraining && (
                    <SelectItem value="training">교육 일정</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!canCreateTraining && !isEditing && (
                <p className="text-xs text-muted-foreground">
                  교육 일정은 관리자만 생성할 수 있습니다.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">시작 *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">종료 *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="allDay"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(!!checked)}
              />
              <Label htmlFor="allDay" className="font-normal">
                종일 일정
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="장소 (선택사항)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="일정 설명 (선택사항)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>색상</Label>
              <div className="flex gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      color === opt.value
                        ? "border-gray-800 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: opt.value }}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? "수정" : "생성"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

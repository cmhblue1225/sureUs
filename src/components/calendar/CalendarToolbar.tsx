"use client";

/**
 * Calendar Toolbar Component
 *
 * Contains view toggle, navigation, and search controls
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
} from "lucide-react";
import type { CalendarViewType } from "./FullCalendarWrapper";

interface CalendarToolbarProps {
  currentView: CalendarViewType;
  currentDate: Date;
  searchQuery: string;
  onViewChange: (view: CalendarViewType) => void;
  onDateChange: (date: Date) => void;
  onSearchChange: (query: string) => void;
  onToday: () => void;
}

const viewLabels: Record<CalendarViewType, string> = {
  dayGridMonth: "월",
  timeGridWeek: "주",
  timeGridDay: "일",
};

export function CalendarToolbar({
  currentView,
  currentDate,
  searchQuery,
  onViewChange,
  onDateChange,
  onSearchChange,
  onToday,
}: CalendarToolbarProps) {
  const formatTitle = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    if (currentView === "dayGridMonth") {
      return `${year}년 ${month}월`;
    } else if (currentView === "timeGridWeek") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startMonth = startOfWeek.getMonth() + 1;
      const endMonth = endOfWeek.getMonth() + 1;
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();

      if (startMonth === endMonth) {
        return `${year}년 ${startMonth}월 ${startDay}일 - ${endDay}일`;
      }
      return `${startMonth}월 ${startDay}일 - ${endMonth}월 ${endDay}일`;
    } else {
      const day = currentDate.getDate();
      const weekday = currentDate.toLocaleDateString("ko-KR", {
        weekday: "long",
      });
      return `${year}년 ${month}월 ${day}일 (${weekday})`;
    }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (currentView === "dayGridMonth") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === "timeGridWeek") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === "dayGridMonth") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === "timeGridWeek") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  return (
    <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Navigation and Title */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrev} aria-label="이전">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} aria-label="다음">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" onClick={onToday}>
          오늘
        </Button>
        <h2 className="text-lg font-semibold ml-2">{formatTitle()}</h2>
      </div>

      {/* View Toggle and Search */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="일정 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-40 sm:w-48"
          />
        </div>

        {/* View Toggle Buttons */}
        <div className="flex rounded-lg border overflow-hidden">
          {(Object.keys(viewLabels) as CalendarViewType[]).map((view) => (
            <Button
              key={view}
              variant={currentView === view ? "default" : "ghost"}
              size="sm"
              className="rounded-none px-3"
              onClick={() => onViewChange(view)}
            >
              {viewLabels[view]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

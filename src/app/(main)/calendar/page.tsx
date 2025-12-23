"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FullCalendarWrapper, type CalendarViewType } from "@/components/calendar/FullCalendarWrapper";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { EventModal } from "@/components/calendar/EventModal";
import { EventTypeFilter } from "@/components/calendar/EventTypeFilter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toFullCalendarEvents, type CalendarEvent } from "@/lib/calendar/eventTransform";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "training" | "personal">("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarViewType>("dayGridMonth");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "user">("user");

  // 사용자 역할 조회
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/profile/me");
        const data = await res.json();
        if (data.success) {
          setUserRole(data.data.role || "user");
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      }
    }
    fetchUserRole();
  }, []);

  // 일정 조회
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // 뷰에 따라 날짜 범위 계산
      let startDate: Date;
      let endDate: Date;

      if (currentView === "dayGridMonth") {
        // 월간 뷰: 해당 월의 전체 (앞뒤 여유 포함)
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0, 23, 59, 59);
      } else if (currentView === "timeGridWeek") {
        // 주간 뷰: 해당 주
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // 일간 뷰: 해당 일
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        eventType: filterType,
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const res = await fetch(`/api/calendar?${params}`);
      const data = await res.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast({
        title: "오류",
        description: "일정을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, currentView, filterType, searchQuery, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // FullCalendar 형식으로 변환된 이벤트
  const fullCalendarEvents = useMemo(() => {
    return toFullCalendarEvents(events);
  }, [events]);

  // 일정 클릭 핸들러
  const handleEventClick = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate(null);
      setIsModalOpen(true);
    }
  };

  // 날짜 클릭 핸들러 (새 일정 생성)
  const handleDateClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // 드래그 앤 드롭 핸들러
  const handleEventDrop = async (eventId: string, start: Date, end: Date): Promise<boolean> => {
    try {
      const res = await fetch(`/api/calendar/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        // 낙관적 업데이트
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, start_date: start.toISOString(), end_date: end.toISOString() }
              : e
          )
        );
        toast({
          title: "성공",
          description: "일정이 이동되었습니다.",
        });
        return true;
      } else {
        toast({
          title: "오류",
          description: data.error || "일정 이동에 실패했습니다.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Event drop error:", error);
      toast({
        title: "오류",
        description: "일정 이동에 실패했습니다.",
        variant: "destructive",
      });
      return false;
    }
  };

  // 리사이즈 핸들러
  const handleEventResize = async (eventId: string, start: Date, end: Date): Promise<boolean> => {
    return handleEventDrop(eventId, start, end);
  };

  // 오늘 버튼 핸들러
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  // 저장 완료 후
  const handleSave = () => {
    handleCloseModal();
    fetchEvents();
  };

  // 삭제 완료 후
  const handleDelete = () => {
    handleCloseModal();
    fetchEvents();
  };

  // 새 일정 추가 버튼
  const handleAddEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">캘린더</h1>
          <p className="text-muted-foreground">교육 일정과 개인 일정을 관리하세요</p>
        </div>
        <Button onClick={handleAddEvent}>
          <Plus className="w-4 h-4 mr-2" />
          일정 추가
        </Button>
      </div>

      {/* 필터 */}
      <div className="mb-4">
        <EventTypeFilter value={filterType} onChange={setFilterType} />
      </div>

      {/* 툴바 */}
      <CalendarToolbar
        currentView={currentView}
        currentDate={currentDate}
        searchQuery={searchQuery}
        onViewChange={setCurrentView}
        onDateChange={setCurrentDate}
        onSearchChange={setSearchQuery}
        onToday={handleToday}
      />

      {/* 캘린더 */}
      <Card className="p-4">
        <FullCalendarWrapper
          events={fullCalendarEvents}
          currentView={currentView}
          currentDate={currentDate}
          isLoading={isLoading}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
        />
      </Card>

      {/* 일정 생성/수정 모달 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        defaultDate={selectedDate}
        onSave={handleSave}
        onDelete={handleDelete}
        userRole={userRole}
      />
    </div>
  );
}

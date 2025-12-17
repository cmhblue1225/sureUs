"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventModal } from "@/components/calendar/EventModal";
import { EventTypeFilter } from "@/components/calendar/EventTypeFilter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "training" | "personal">(
    "all"
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
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
      // 현재 월의 시작일과 종료일
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const params = new URLSearchParams({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        eventType: filterType,
      });

      const res = await fetch(`/api/calendar?${params}`);
      const data = await res.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, filterType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 일정 생성/수정 모달 열기
  const handleOpenModal = (event?: CalendarEvent) => {
    setSelectedEvent(event || null);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
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

  return (
    <div className="container mx-auto py-6 px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">캘린더</h1>
          <p className="text-muted-foreground">교육 일정과 개인 일정을 관리하세요</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          일정 추가
        </Button>
      </div>

      {/* 필터 */}
      <div className="mb-4">
        <EventTypeFilter value={filterType} onChange={setFilterType} />
      </div>

      {/* 캘린더 뷰 */}
      <CalendarView
        events={events}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onEventClick={handleOpenModal}
        isLoading={isLoading}
      />

      {/* 일정 생성/수정 모달 */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        onSave={handleSave}
        onDelete={handleDelete}
        userRole={userRole}
      />
    </div>
  );
}

"use client";

/**
 * FullCalendar Wrapper Component
 *
 * Wraps FullCalendar with custom styling and event handlers
 * Supports month, week, and day views with drag-and-drop
 */

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg, DateClickArg } from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import koLocale from "@fullcalendar/core/locales/ko";
import { Loader2 } from "lucide-react";

export type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

interface FullCalendarWrapperProps {
  events: EventInput[];
  currentView: CalendarViewType;
  currentDate: Date;
  isLoading?: boolean;
  onEventClick: (eventId: string) => void;
  onDateClick: (date: Date) => void;
  onEventDrop: (eventId: string, start: Date, end: Date) => Promise<boolean>;
  onEventResize: (eventId: string, start: Date, end: Date) => Promise<boolean>;
  onDatesSet?: (start: Date, end: Date) => void;
}

export function FullCalendarWrapper({
  events,
  currentView,
  currentDate,
  isLoading = false,
  onEventClick,
  onDateClick,
  onEventDrop,
  onEventResize,
  onDatesSet,
}: FullCalendarWrapperProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Update calendar view when currentView changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(currentView);
    }
  }, [currentView]);

  // Update calendar date when currentDate changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.gotoDate(currentDate);
    }
  }, [currentDate]);

  const handleEventClick = (info: EventClickArg) => {
    onEventClick(info.event.id);
  };

  const handleDateClick = (info: DateClickArg) => {
    onDateClick(info.date);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const { event, revert } = info;
    const start = event.start;
    const end = event.end || event.start;

    if (!start || !end) {
      revert();
      return;
    }

    const success = await onEventDrop(event.id, start, end);
    if (!success) {
      revert();
    }
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const { event, revert } = info;
    const start = event.start;
    const end = event.end || event.start;

    if (!start || !end) {
      revert();
      return;
    }

    const success = await onEventResize(event.id, start, end);
    if (!success) {
      revert();
    }
  };

  return (
    <div className="relative fc-wrapper">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={currentView}
        initialDate={currentDate}
        locale={koLocale}
        headerToolbar={false}
        events={events}
        editable={true}
        droppable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        nowIndicator={true}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        datesSet={(dateInfo) => {
          onDatesSet?.(dateInfo.start, dateInfo.end);
        }}
        height="auto"
        expandRows={true}
        stickyHeaderDates={true}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        dayHeaderFormat={{
          weekday: "short",
          day: "numeric",
        }}
        allDaySlot={true}
        allDayText="종일"
        moreLinkText={(num) => `+${num}개 더보기`}
        noEventsText="일정이 없습니다"
        eventClassNames={(arg) => {
          const eventType = arg.event.extendedProps?.eventType;
          return eventType === "training" ? "fc-event-training" : "fc-event-personal";
        }}
      />
    </div>
  );
}

/**
 * Calendar Event Transform Utilities
 *
 * Transforms between our CalendarEvent format and FullCalendar's EventInput format
 */

import type { EventInput } from "@fullcalendar/core";

export interface CalendarEvent {
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

/**
 * Transform our CalendarEvent to FullCalendar EventInput format
 * Note: FullCalendar treats end dates as exclusive for all-day events,
 * so we add 1 day to make the event display through the intended end date.
 */
export function toFullCalendarEvent(event: CalendarEvent): EventInput {
  let endDate = event.end_date;

  // For all-day events, add 1 day to end date for correct FullCalendar display
  if (event.all_day) {
    const end = new Date(event.end_date);
    end.setDate(end.getDate() + 1);
    endDate = end.toISOString();
  }

  return {
    id: event.id,
    title: event.title,
    start: event.start_date,
    end: endDate,
    allDay: event.all_day,
    backgroundColor: event.color || getDefaultColor(event.event_type),
    borderColor: event.color || getDefaultColor(event.event_type),
    extendedProps: {
      description: event.description,
      eventType: event.event_type,
      location: event.location,
      userId: event.user_id,
      createdBy: event.created_by,
      creator: event.creator,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    },
  };
}

/**
 * Transform FullCalendar event back to our CalendarEvent format (for API updates)
 * Note: For all-day events, subtract 1 day from end date since we added 1 day for display.
 */
export function fromFullCalendarEvent(fcEvent: {
  id?: string;
  start?: Date | null;
  end?: Date | null;
  allDay?: boolean;
  extendedProps?: Record<string, unknown>;
}): Partial<CalendarEvent> {
  let endDate = fcEvent.end || fcEvent.start;

  // For all-day events, subtract 1 day from end date (reverse of toFullCalendarEvent)
  if (fcEvent.allDay && endDate) {
    const end = new Date(endDate);
    end.setDate(end.getDate() - 1);
    endDate = end;
  }

  return {
    id: fcEvent.id,
    start_date: fcEvent.start?.toISOString(),
    end_date: endDate?.toISOString() || fcEvent.start?.toISOString(),
    all_day: fcEvent.allDay ?? false,
  };
}

/**
 * Get default color based on event type
 */
export function getDefaultColor(eventType: "training" | "personal"): string {
  return eventType === "training" ? "#3B82F6" : "#22C55E";
}

/**
 * Transform an array of CalendarEvents to FullCalendar format
 */
export function toFullCalendarEvents(events: CalendarEvent[]): EventInput[] {
  return events.map(toFullCalendarEvent);
}

/**
 * Format date for display
 */
export function formatEventTime(
  startDate: string,
  endDate: string,
  allDay: boolean
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (allDay) {
    const startStr = start.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
    const endStr = end.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }

  const isSameDay = start.toDateString() === end.toDateString();
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (isSameDay) {
    const dateStr = start.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
    const startTime = start.toLocaleTimeString("ko-KR", timeOptions);
    const endTime = end.toLocaleTimeString("ko-KR", timeOptions);
    return `${dateStr} ${startTime} - ${endTime}`;
  }

  const startStr = start.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    ...timeOptions,
  });
  const endStr = end.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    ...timeOptions,
  });
  return `${startStr} - ${endStr}`;
}

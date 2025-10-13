"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

interface FullCalendarComponentProps {
  events: {
    id: string; // branch id
    location: string;
    manager: string;
    share: number;
    start: Date;
    color: string;
  }[];
  height?: number;
  onViewDetails?: (branchId: string) => void;
}

export default function FullCalendarComponent({
  events,
  height = 600,
  onViewDetails,
}: FullCalendarComponentProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
      }}
      height={height}
      events={events.map((e) => ({
        title: e.location,
        start: e.start,
        allDay: true,
        backgroundColor: e.color,
        extendedProps: {
          id: e.id,
          manager: e.manager,
          share: e.share,
          location: e.location,
        },
      }))}
      eventContent={(info) => {
        const { id, manager, share, location } = info.event.extendedProps;

        return (
          <div className="p-2 rounded-lg shadow-sm border bg-card flex flex-col gap-0.5 break-words">
            <span className="font-semibold text-foreground text-sm">
              {location}
            </span>
            <span className="text-foreground text-xs">{manager}</span>
            <span className="text-green-700 font-medium text-xs">{share}%</span>
            {onViewDetails && (
              <button
                className="text-blue-600 text-xs mt-1 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(id);
                }}
              >
                View Details
              </button>
            )}
          </div>
        );
      }}
    />
  );
}

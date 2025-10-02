"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

interface FullCalendarComponentProps {
  events: {
    location: string;
    manager: string;
    share: number;
    start: Date;
    color: string; // branch color from sidebar/cards
  }[];
  height?: number;
}

export default function FullCalendarComponent({
  events,
  height = 600,
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
        ...e,
        title: e.location,
        backgroundColor: e.color,
      }))}
      eventContent={(info) => {
        const { location, manager, share } = info.event.extendedProps;

        return (
          //LOL UNINTENDED CARD STYLE IT LOOKS COOLER
          <div className="p-2 rounded-lg shadow-sm border bg-card flex flex-col gap-0.5 break-words">
            <span className="font-semibold text-foreground text-sm">
              {location}
            </span>
            <span className="text-foreground text-xs">{manager}</span>
            <span className="text-green-700 font-medium text-xs">{share}%</span>
          </div>
        );
      }}
    />
  );
}

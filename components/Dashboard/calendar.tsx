"use client";

import React, { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useBranches } from "@/hooks/use-branches-query";
import { Calendar1, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardCalendar() {
  const { data: branches = [], isLoading, error } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState<string>("");

  const colors = ["#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa"];

  const branchesWithHarvests = branches.map((b, index) => ({
    ...b,
    color: colors[index % colors.length],
  }));

  const events = branchesWithHarvests
    .filter((b) => selectedBranch === "all" || b.id === selectedBranch)
    .flatMap((branch) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const branchEvents = [];

      for (let year = currentYear; year <= currentYear + 1; year++) {
        for (let month = 0; month < 12; month++) {
          const day = Math.min(branch.harvest_day_of_month, 28);
          const harvestDate = new Date(year, month, day);

          if (!isNaN(harvestDate.getTime())) {
            branchEvents.push({
              id: `${branch.id}-${year}-${month}`,
              title: branch.location,
              start: harvestDate,
              allDay: true,
              backgroundColor: branch.color,
              extendedProps: {
                manager: branch.branch_manager,
                share: branch.share,
              },
            });
          }
        }
      }
      return branchEvents;
    });

  const handlePrev = () => calendarRef.current?.getApi()?.prev();
  const handleNext = () => calendarRef.current?.getApi()?.next();
  const handleToday = () => calendarRef.current?.getApi()?.today();

  // Update date display when calendar loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        setCurrentDate(api.view.title);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-3 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl p-3 flex flex-col items-center justify-center">
        <div className="text-sm text-red-500">Failed to load schedule</div>
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-3 flex flex-col items-center justify-center">
        <div className="text-sm text-muted-foreground">No branches found</div>
        <div className="text-xs text-muted-foreground mt-1">
          Add branches to see the schedule
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-3 flex flex-col h-full">
      {/* Ultra-compact header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Calendar1 className="w-3 h-3" />
          <span className="text-xs font-medium text-foreground">
            Schedule {events.length > 0 ? `(${events.length})` : "(0)"}
          </span>
          <span className="text-xs font-semibold mx-1">{currentDate}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Navigation */}
          <div className="flex items-center gap-0.5">
            <button onClick={handlePrev} className="p-1 hover:bg-muted rounded">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleToday}
              className="px-1.5 py-0.5 text-xs hover:bg-muted rounded"
            >
              Today
            </button>
            <button onClick={handleNext} className="p-1 hover:bg-muted rounded">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <span className="text-xs">Branch: </span>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs p-1 border rounded bg-background focus:ring-1 focus:ring-blue-500 max-w-20"
          >
            <option value="all">All</option>
            {branches.slice(0, 3).map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.location.split(" ")[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar - Fills remaining space */}
      <div className="flex-1 min-h-0">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          // Remove fixed height and let it fill container
          height="100%"
          // Ensure it shows full month
          fixedWeekCount={false}
          showNonCurrentDates={true}
          // Better event display
          events={events}
          datesSet={(dateInfo) => {
            setCurrentDate(dateInfo.view.title);
          }}
          eventContent={(info) => (
            <div className="p-0.5 text-xs">
              <div className="font-semibold truncate">{info.event.title}</div>
              <div className="text-green-600 font-medium">
                {info.event.extendedProps.share}%
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}

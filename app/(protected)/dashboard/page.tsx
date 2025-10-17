"use client";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-neutral-900 p-6 text-white">
      <div className="grid grid-cols-4 gap-4">
        {/* Big Line Chart */}
        <div className="col-span-3 bg-neutral-800 rounded-2xl p-4 h-48 flex items-center justify-center">
          BIG LINE CHART
        </div>
        {/* Real Time Page */}
        <div className="bg-neutral-800 rounded-2xl p-4 h-48 flex items-center justify-center">
          Real time page
        </div>

        {/* Calendar */}
        <div className="col-span-2 row-span-2 bg-neutral-800 rounded-2xl p-4 h-80 flex items-center justify-center">
          calendar?
        </div>

        {/* Small boxes */}
        <div className="bg-neutral-800 rounded-2xl p-2 flex flex-col gap-4">
          <div className="bg-neutral-700 rounded-xl p-3 text-center">
            upcoming harvest
          </div>
          <div className="bg-neutral-700 rounded-xl p-3 text-center">
            recent harvested
          </div>
        </div>
        <div className="bg-neutral-800 rounded-2xl p-4 flex items-center justify-center">
          online devices
        </div>
        <div className="bg-neutral-800 rounded-2xl p-4 flex items-center justify-center">
          new device
        </div>

        {/* Logs and Notifications */}
        <div className="bg-neutral-800 rounded-2xl p-4 flex items-center justify-center">
          logs and notifications?
        </div>
      </div>
      <div className="mt-4 bg-neutral-800 rounded-2xl p-4 h-48 flex items-center justify-center w-full">
        Overall system summary / activity feed / analytics log
      </div>
    </div>
  );
}

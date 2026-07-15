"use client";

import { useState } from "react";
import { SchedulerList } from "./SchedulerList";
import { SchedulerCalendar } from "./SchedulerCalendar";
import type { ScheduledPost } from "./queries";

export function SchedulerView({ posts }: { posts: ScheduledPost[] }) {
  const [view, setView] = useState<"list" | "calendar">("calendar");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-neutral-300 p-0.5 text-sm">
        <button
          onClick={() => setView("calendar")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            view === "calendar" ? "bg-brand-600 text-white" : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setView("list")}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            view === "list" ? "bg-brand-600 text-white" : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          List
        </button>
      </div>

      {view === "calendar" ? <SchedulerCalendar posts={posts} /> : <SchedulerList posts={posts} />}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ScheduledPost } from "./queries";

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-neutral-400",
  SCHEDULED: "bg-blue-500",
  PUBLISHING: "bg-amber-500",
  PUBLISHED: "bg-green-500",
  FAILED: "bg-red-500",
};

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function postDateKey(post: ScheduledPost) {
  const iso = post.scheduled_for ?? post.created_at;
  return iso.slice(0, 10);
}

export function SchedulerCalendar({ posts }: { posts: ScheduledPost[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of posts) {
      const key = postDateKey(post);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    return map;
  }, [posts]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedPosts = selectedDay ? postsByDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">
          {firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-lg border border-neutral-300 px-2.5 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            ‹
          </button>
          <button
            onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-lg border border-neutral-300 px-2.5 py-1 text-sm text-neutral-600 hover:bg-neutral-50"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50 text-center text-xs font-medium text-neutral-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) {
              return <div key={i} className="min-h-24 border-b border-r border-neutral-100 bg-neutral-50/50" />;
            }
            const key = dateKey(date);
            const dayPosts = postsByDay.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(dayPosts.length ? key : null)}
                className={`min-h-24 border-b border-r border-neutral-100 p-1.5 text-left align-top transition ${
                  isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    isToday ? "bg-brand-600 text-white" : "text-neutral-600"
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 2).map((p) => (
                    <div key={p.id} className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status] ?? "bg-neutral-400"}`} />
                      <span className="truncate text-[10px] text-neutral-600">
                        {p.caption || "Untitled"}
                      </span>
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <p className="text-[10px] text-neutral-400">+{dayPosts.length - 2} more</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">
              {new Date(selectedDay + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {selectedPosts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-neutral-100 p-2">
                {p.assets[0]?.url ? (
                  p.assets[0].type === "VIDEO" ? (
                    <video src={p.assets[0].url} muted className="h-10 w-10 rounded object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.assets[0].url} alt="" className="h-10 w-10 rounded object-cover" />
                  )
                ) : (
                  <div className="h-10 w-10 rounded bg-neutral-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-900">{p.caption || "No caption"}</p>
                </div>
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[p.status] ?? "bg-neutral-400"}`} title={p.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

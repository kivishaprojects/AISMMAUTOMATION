"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DayActivity } from "@/features/org/dashboard-stats";

export function ActivityChart({ data }: { data: DayActivity[] }) {
  const isEmpty = data.every((d) => d.generations === 0 && d.posts === 0);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm font-semibold text-neutral-900">Activity, last 7 days</p>
      <p className="mt-0.5 text-xs text-neutral-500">AI generations and posts published or scheduled</p>

      {isEmpty ? (
        <div className="flex h-52 items-center justify-center">
          <p className="text-sm text-neutral-400">Nothing yet this week — generate something in Creative Studio.</p>
        </div>
      ) : (
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="genFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="postFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#a3a3a3" }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="generations" name="Generations" stroke="#4f46e5" strokeWidth={2} fill="url(#genFill)" />
              <Area type="monotone" dataKey="posts" name="Posts" stroke="#10b981" strokeWidth={2} fill="url(#postFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

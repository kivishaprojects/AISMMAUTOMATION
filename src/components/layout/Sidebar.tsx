"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { NAV_TOP, NAV_GROUPS } from "./nav-config";

export function Sidebar({
  orgName,
  orgRole,
}: {
  orgName?: string;
  orgRole?: string;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.label] = group.items.some((item) => pathname?.startsWith(item.href));
    }
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const orgInitial = (orgName?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-neutral-200 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles size={16} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-900">AI Marketing OS</p>
          {orgName && (
            <p className="truncate text-xs text-neutral-500">
              {orgName} · {orgRole}
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_TOP.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon size={16} strokeWidth={2} className={active ? "text-brand-600" : "text-neutral-400"} />
              {item.label}
            </Link>
          );
        })}

        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label];
          const GroupIcon = group.icon;
          return (
            <div key={group.label} className="pt-3">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-600"
              >
                <GroupIcon size={13} strokeWidth={2} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronRight
                  size={13}
                  strokeWidth={2}
                  className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={16} strokeWidth={2} className={active ? "text-brand-600" : "text-neutral-400"} />
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {orgName && (
        <div className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {orgInitial}
          </div>
          <p className="truncate text-xs font-medium text-neutral-600">{orgName}</p>
        </div>
      )}
    </aside>
  );
}

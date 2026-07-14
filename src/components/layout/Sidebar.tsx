"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    // Auto-expand whichever group contains the current route.
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.label] = group.items.some((item) => pathname?.startsWith(item.href));
    }
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside className="flex w-64 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4">
        <p className="text-sm font-semibold text-neutral-900">AI Marketing OS</p>
        {orgName && (
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {orgName} · {orgRole}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_TOP.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === item.href
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {NAV_GROUPS.map((group) => {
          const isOpen = openGroups[group.label];
          return (
            <div key={group.label} className="pt-2">
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-600"
              >
                {group.label}
                <span className={`transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
              </button>
              {isOpen && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                        pathname === item.href
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

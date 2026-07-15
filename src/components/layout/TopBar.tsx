"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/features/notifications/actions";
import type { Notification } from "@/features/notifications/queries";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function TopBar({
  userEmail,
  userName,
  notifications,
  unreadCount,
}: {
  userEmail: string;
  userName?: string | null;
  notifications: Notification[];
  unreadCount: number;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initial = (userName?.trim()?.[0] || userEmail[0] || "?").toUpperCase();

  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b border-neutral-200 bg-white px-6">
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen((v) => !v)}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-medium text-neutral-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsReadAction()}
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-800"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-2 py-3 text-sm text-neutral-500">
                No notifications yet. Post results and content-planning reminders will show up here.
              </p>
            ) : (
              <div className="max-h-80 space-y-0.5 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "/dashboard"}
                    onClick={() => !n.read && markNotificationReadAction(n.id)}
                    className={`block rounded-lg px-2 py-2 text-sm hover:bg-neutral-50 ${!n.read ? "bg-neutral-50" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />}
                      <p className="font-medium text-neutral-900">{n.title}</p>
                    </div>
                    {n.body && <p className="mt-0.5 truncate text-xs text-neutral-500">{n.body}</p>}
                    <p className="mt-0.5 text-[10px] text-neutral-400">{timeAgo(n.created_at)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white hover:opacity-90"
        >
          {initial}
        </button>
        {profileOpen && (
          <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
            <div className="border-b border-neutral-100 px-3 py-2">
              {userName && <p className="truncate text-sm font-medium text-neutral-900">{userName}</p>}
              <p className="truncate text-xs text-neutral-500">{userEmail}</p>
            </div>
            <Link
              href="/dashboard/settings/profile"
              className="block rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              My Profile
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Logout
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

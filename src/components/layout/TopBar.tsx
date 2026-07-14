"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";

export function TopBar({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName?: string | null;
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
        </button>
        {notifOpen && (
          <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-lg">
            <p className="text-sm font-medium text-neutral-900">Notifications</p>
            <p className="mt-2 text-sm text-neutral-500">
              No notifications yet. Content-planning reminders and job alerts will show up here.
            </p>
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-medium text-white hover:opacity-90"
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

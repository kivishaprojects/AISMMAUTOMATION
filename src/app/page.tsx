import Link from "next/link";
import { Sparkles, ImageIcon, CalendarClock, Wallet } from "lucide-react";

const FEATURES = [
  { icon: ImageIcon, label: "AI images & video", tint: "bg-indigo-50 text-indigo-600" },
  { icon: CalendarClock, label: "Schedule everywhere", tint: "bg-amber-50 text-amber-600" },
  { icon: Wallet, label: "Pay only for what you use", tint: "bg-emerald-50 text-emerald-600" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <Sparkles size={22} strokeWidth={2.25} />
      </div>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-neutral-900">
        AI Marketing OS
      </h1>
      <p className="mt-3 max-w-md text-neutral-500">
        The AI-powered marketing operating system for growing businesses.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Get started
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.tint}`}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <p className="text-sm font-medium text-neutral-700">{f.label}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}

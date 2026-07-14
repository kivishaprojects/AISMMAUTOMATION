"use client";

import { useActionState } from "react";
import { createOrgOnboardingAction } from "@/features/auth/actions";

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    createOrgOnboardingAction,
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">
          One more thing
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          What&apos;s the name of your business or organization?
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Business / organization name
            </label>
            <input
              name="orgName"
              type="text"
              required
              autoFocus
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? "Setting up your workspace…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

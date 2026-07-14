"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/features/settings/profile-actions";

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Change Password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Doesn&apos;t apply if you sign in with Google.
        </p>
      </div>

      <form action={formAction} className="max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">New password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Confirm new password</label>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state && "success" in state && state.success && (
          <p className="text-sm text-green-600">Password updated.</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

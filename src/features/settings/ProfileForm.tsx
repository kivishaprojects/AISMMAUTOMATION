"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/features/settings/profile-actions";

export function ProfileForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700">Email</label>
        <input
          value={email}
          disabled
          className="mt-1 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
        />
        <p className="mt-1 text-xs text-neutral-400">Login email — contact support to change it.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700">Full name</label>
        <input
          name="fullName"
          defaultValue={fullName}
          required
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state && "success" in state && state.success && (
        <p className="text-sm text-green-600">Saved.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

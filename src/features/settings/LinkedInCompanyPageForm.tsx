"use client";

import { useActionState } from "react";
import { setLinkedInCompanyPageAction } from "./social-accounts-actions";

export function LinkedInCompanyPageForm({ accountId }: { accountId: string }) {
  const [state, formAction, pending] = useActionState(
    setLinkedInCompanyPageAction.bind(null, accountId),
    null
  );

  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <input
        name="pageId"
        placeholder="Company Page numeric ID"
        className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:border-neutral-900 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Post as Page"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

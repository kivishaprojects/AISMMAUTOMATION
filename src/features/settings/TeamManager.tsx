"use client";

import { useActionState } from "react";
import {
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "./team-actions";
import type { TeamMember } from "./team-queries";

const ROLES = ["OWNER", "ADMIN", "MANAGER", "EDITOR", "APPROVER", "VIEWER"];

export function TeamManager({
  organizationId,
  members,
}: {
  organizationId: string;
  members: TeamMember[];
}) {
  const [state, formAction, pending] = useActionState(
    inviteMemberAction.bind(null, organizationId),
    null
  );

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-6"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-neutral-700">Invite by email</label>
          <input
            type="email"
            name="email"
            required
            placeholder="teammate@company.com"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Role</label>
          <select
            name="role"
            defaultValue="EDITOR"
            className="mt-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Inviting…" : "Invite"}
        </button>
        {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
        {state && "success" in state && state.success && (
          <p className="w-full text-sm text-green-600">Invite sent.</p>
        )}
      </form>

      <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {members.map((m) => (
          <div key={m.membershipId} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{m.email}</p>
              <p className="text-xs text-neutral-500">
                Joined {new Date(m.joinedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                defaultValue={m.role}
                onChange={(e) => updateMemberRoleAction(m.membershipId, e.target.value)}
                className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs focus:border-brand-600 focus:outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (confirm(`Remove ${m.email} from this organization?`)) {
                    removeMemberAction(m.membershipId);
                  }
                }}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

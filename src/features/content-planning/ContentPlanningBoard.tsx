"use client";

import { useActionState } from "react";
import { createContentNoteAction, deleteContentNoteAction } from "./actions";
import type { ContentNote } from "./queries";

export function ContentPlanningBoard({
  organizationId,
  notes,
}: {
  organizationId: string;
  notes: ContentNote[];
}) {
  const [state, formAction, pending] = useActionState(
    createContentNoteAction.bind(null, organizationId),
    null
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = notes.filter((n) => n.note_date >= today);
  const past = notes.filter((n) => n.note_date < today);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-1"
      >
        <h2 className="text-sm font-semibold text-neutral-900">Add a note</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Date</label>
          <input
            type="date"
            name="noteDate"
            required
            defaultValue={today}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Diwali campaign creatives"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Details</label>
          <textarea
            name="details"
            rows={3}
            placeholder="What needs to be generated/posted"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
        <p className="text-xs text-neutral-400">
          Email + in-app reminders on the note date aren&apos;t wired up yet —
          that needs a scheduled job and an email provider. This list is
          live and functional in the meantime.
        </p>
      </form>

      <div className="space-y-6 lg:col-span-2">
        <NoteList title="Upcoming" notes={upcoming} />
        {past.length > 0 && <NoteList title="Past" notes={past} muted />}
      </div>
    </div>
  );
}

function NoteList({
  title,
  notes,
  muted,
}: {
  title: string;
  notes: ContentNote[];
  muted?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h3>
      {notes.length === 0 ? (
        <p className="text-sm text-neutral-400">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 ${muted ? "opacity-60" : ""}`}
            >
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  {new Date(note.note_date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="mt-0.5 text-sm font-medium text-neutral-900">{note.title}</p>
                {note.details && (
                  <p className="mt-1 text-sm text-neutral-500">{note.details}</p>
                )}
              </div>
              <button
                onClick={() => deleteContentNoteAction(note.id)}
                className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

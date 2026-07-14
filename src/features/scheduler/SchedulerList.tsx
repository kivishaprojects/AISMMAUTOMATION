import type { ScheduledPost } from "./queries";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  PUBLISHING: "bg-amber-50 text-amber-700",
  PUBLISHED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SchedulerList({ posts }: { posts: ScheduledPost[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm text-neutral-500">
          Nothing scheduled yet. Publish or schedule a post from Creative Studio to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center gap-4 p-4">
          {post.assets[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.assets[0].url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-lg bg-neutral-100" />
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neutral-900">
              {post.caption || <span className="text-neutral-400">No caption</span>}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {post.status === "SCHEDULED"
                ? `Scheduled for ${formatDate(post.scheduled_for)}`
                : `Created ${formatDate(post.created_at)}`}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              STATUS_STYLES[post.status] ?? "bg-neutral-100 text-neutral-600"
            }`}
          >
            {post.status}
          </span>
        </div>
      ))}
    </div>
  );
}

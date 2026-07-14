const PLATFORMS = [
  { name: "Facebook", color: "#1877F2" },
  { name: "Instagram", color: "#E4405F" },
  { name: "X (Twitter)", color: "#000000" },
  { name: "LinkedIn", color: "#0A66C2" },
];

export default function SocialAccountsPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Social Media Accounts</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Connect accounts to publish directly from the Scheduler.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Connecting real accounts requires registering an app with each
        platform (Meta App Review for Facebook/Instagram, a Twitter/X
        developer app, a LinkedIn app) and adding the resulting client
        credentials as environment variables. That&apos;s a one-time setup
        step outside this app — once done, these buttons wire up to real
        OAuth flows against the <code>social_accounts</code> table already
        in the schema.
      </div>

      <div className="space-y-3">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-sm font-medium text-neutral-900">{p.name}</span>
            </div>
            <button
              disabled
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400"
              title="Requires platform app credentials"
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

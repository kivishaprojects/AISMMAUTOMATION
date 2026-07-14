export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-neutral-700">Coming soon</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  );
}

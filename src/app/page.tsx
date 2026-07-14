import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
        AI Marketing OS
      </h1>
      <p className="mt-3 max-w-md text-neutral-500">
        The AI-powered marketing operating system for growing businesses.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/sign-up"
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
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
    </main>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { GoogleSignInButton } from "@/features/auth/google-button";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUpAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">
          Create your workspace
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Start your AI Marketing OS account.
        </p>

        <div className="mt-6">
          <GoogleSignInButton />
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs text-neutral-400">OR</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Full name
            </label>
            <input
              name="fullName"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Business / organization name
            </label>
            <input
              name="orgName"
              type="text"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-neutral-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

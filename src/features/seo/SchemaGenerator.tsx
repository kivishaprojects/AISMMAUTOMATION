"use client";

import { useActionState, useState } from "react";
import { generateSchemaAction } from "./schema-generator-actions";
import { SCHEMA_TYPES } from "./schema-generator-constants";

export function SchemaGenerator({ organizationId }: { organizationId: string }) {
  const [state, formAction, pending] = useActionState(generateSchemaAction.bind(null, organizationId), null);
  const [copied, setCopied] = useState(false);

  const jsonLd = state && "success" in state && state.success ? state.jsonLd : null;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700">Schema type</label>
          <select
            name="schemaType"
            defaultValue="LocalBusiness"
            className="mt-1 w-full max-w-xs rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          >
            {SCHEMA_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Details</label>
          <textarea
            name="details"
            required
            rows={5}
            placeholder="e.g. Business name: Sharma Sweets. Address: 12 MG Road, Ahmedabad, Gujarat 380001. Phone: +91 98765 43210. Hours: Mon-Sat 9am-9pm. Website: sharmasweets.example.com. Sells traditional Indian sweets and snacks."
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Generating…" : "Generate schema"}
        </button>
        <p className="text-xs text-neutral-400">Costs 2 wallet credits (platform-managed key) or your own OpenAI usage.</p>
      </form>

      {jsonLd && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900">Paste this into your page&apos;s &lt;head&gt;</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-neutral-900 p-4 text-xs text-neutral-100">
            <code>{`<script type="application/ld+json">\n${jsonLd}\n</script>`}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

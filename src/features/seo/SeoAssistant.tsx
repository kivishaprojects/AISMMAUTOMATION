"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { askSeoAssistantAction } from "./content-tools-actions";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "What are my biggest SEO problems right now?",
  "What should I work on this week?",
  "How do I improve my AI search visibility?",
  "Explain my latest scan results in simple words",
];

export function SeoAssistant({ organizationId }: { organizationId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || isPending) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    startTransition(async () => {
      const result = await askSeoAssistantAction(organizationId, next);
      if (result.error) setError(result.error);
      else if (result.reply) setMessages([...next, { role: "assistant", content: result.reply }]);
    });
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col rounded-2xl border border-neutral-200 bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md pt-10 text-center">
            <p className="text-sm text-neutral-500">
              Ask anything about SEO/GEO strategy or your own workspace — the assistant can see your
              scans, changes queue, and tracked prompts.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {SUGGESTED.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-50">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
              m.role === "user" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-800"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isPending && <p className="text-xs text-neutral-400">Thinking…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-neutral-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Fix all low-risk SEO issues — where do I start?"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
        <button type="submit" disabled={isPending || !input.trim()} className="rounded-lg bg-brand-600 p-2.5 text-white hover:bg-brand-700 disabled:opacity-50">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

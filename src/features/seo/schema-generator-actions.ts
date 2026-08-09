"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveOpenAiKey, debitWalletCredits, refundWalletCredits, CREDIT_COSTS } from "@/lib/ai/usage";
import { SCHEMA_TYPES } from "./schema-generator-constants";

const schema = z.object({
  schemaType: z.enum(SCHEMA_TYPES),
  details: z.string().min(10, "Give a bit more detail so the schema is accurate"),
});

export async function generateSchemaAction(
  organizationId: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = schema.safeParse({
    schemaType: formData.get("schemaType"),
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const apiKeyOverride = await resolveOpenAiKey(supabase, organizationId);

  if (!apiKeyOverride) {
    const { error: debitError } = await debitWalletCredits(
      supabase,
      organizationId,
      CREDIT_COSTS.SCHEMA_GEN,
      "Schema markup generation"
    );
    if (debitError) return { error: debitError };
  }

  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "No OpenAI key available. Add one under Settings \u2192 My API Keys." };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              `Generate valid schema.org JSON-LD markup of type "${parsed.data.schemaType}". ` +
              "Respond with ONLY the JSON-LD object (including @context and @type), no explanation, " +
              "no markdown code fences, no extra text. Use the details given to fill in real fields; " +
              "omit fields you don't have information for rather than inventing fake data.",
          },
          { role: "user", content: parsed.data.details },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) throw new Error(`Schema generation failed: ${await res.text()}`);
    const json = await res.json();
    let content: string = json.choices?.[0]?.message?.content ?? "";
    content = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

    // Validate before handing it back: must parse, and must carry the
    // schema.org context and a type or AI/search engines will ignore it.
    const parsedLd = JSON.parse(content);
    const items = Array.isArray(parsedLd) ? parsedLd : [parsedLd];
    for (const item of items) {
      if (!item["@context"] || !String(item["@context"]).includes("schema.org")) {
        throw new Error("Generated schema is missing a schema.org @context — please regenerate.");
      }
      if (!item["@type"]) {
        throw new Error("Generated schema is missing @type — please regenerate.");
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("content_docs").insert({
        organization_id: organizationId,
        created_by: user.id,
        doc_type: "SCHEMA_DOC",
        title: `${parsed.data.schemaType}: ${parsed.data.details.slice(0, 60)}`,
        input_context: parsed.data.details.slice(0, 300),
        content,
      });
    }

    return { success: true, jsonLd: content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Schema generation failed";
    if (!apiKeyOverride) {
      await refundWalletCredits(organizationId, CREDIT_COSTS.SCHEMA_GEN, "Refund: failed schema generation");
    }
    return { error: message };
  }
}

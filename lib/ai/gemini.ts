import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

import { AIProviderError, type AIProvider, type SynthInput, type SynthResult } from "./provider";

const responseSchema = z.object({
  summary: z.string(),
  citedEvidenceIds: z.array(z.string()).default([]),
});

function buildPrompt(input: SynthInput): string {
  const evidence =
    input.evidence.length > 0
      ? input.evidence
          .map(
            (e) =>
              `[${e.id}] ${e.claim} (source: ${e.sourceType}, confidence: ${e.confidence}, collected: ${e.collectedAt})`,
          )
          .join("\n")
      : "(no evidence cards available)";

  return [
    `You are a procurement strategy analyst. Draft a concise, executive ${input.task} for the category below.`,
    "",
    "STRICT GROUNDING RULES:",
    "- Cite claims ONLY by referencing an evidence id in square brackets, e.g. [abc123].",
    "- Use ONLY ids from the EVIDENCE list. Never invent ids or facts.",
    "- If evidence is insufficient for a point, say so explicitly rather than inventing.",
    "- Return JSON: { summary: string, citedEvidenceIds: string[] } where citedEvidenceIds lists every id you cited.",
    "",
    "CONTEXT:",
    input.context,
    "",
    "EVIDENCE:",
    evidence,
  ].join("\n");
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async synthesize(input: SynthInput): Promise<SynthResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AIProviderError(
        "GEMINI_API_KEY is not set. Add it to .env.local to enable AI synthesis.",
      );
    }
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const ai = new GoogleGenAI({ apiKey });

    let raw: string;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: buildPrompt(input),
        config: {
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              citedEvidenceIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["summary", "citedEvidenceIds"],
          },
        },
      });
      raw = response.text ?? "";
    } catch (e) {
      throw new AIProviderError(
        `Gemini request failed: ${e instanceof Error ? e.message : "unknown error"}`,
      );
    }

    let parsed: z.infer<typeof responseSchema>;
    try {
      parsed = responseSchema.parse(JSON.parse(raw));
    } catch {
      throw new AIProviderError("Gemini returned an unexpected response shape.");
    }

    return {
      summary: parsed.summary,
      citedEvidenceIds: parsed.citedEvidenceIds,
      model: `gemini:${model}`,
    };
  }
}

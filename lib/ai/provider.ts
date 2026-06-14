/**
 * AI provider abstraction (CLAUDE.md §10.0). No file calls a model SDK directly —
 * everything goes through `getAIProvider()`. The interface starts with the agent
 * we need now (synthesis); research/extract/monitor/negotiate are added as those
 * agents are built. Both backends return identical, Zod-validated shapes.
 */
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";

export interface SynthEvidence {
  id: string;
  claim: string;
  sourceType: string;
  confidence: string;
  collectedAt: string; // ISO date
}

export interface SynthInput {
  task: string; // e.g. "Executive summary"
  context: string; // workspace facts (name, archetype, positioning, options)
  evidence: SynthEvidence[];
}

export interface SynthResult {
  summary: string;
  citedEvidenceIds: string[];
  model: string; // "provider:model"
}

export interface AIProvider {
  readonly name: string;
  synthesize(input: SynthInput): Promise<SynthResult>;
}

/** Raised when a provider is selected but not usable (e.g. missing key). */
export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}

/**
 * Choose the provider once from env. Default is Gemini (free build tier). The rest
 * of the app only ever sees `AIProvider`. Neither provider touches the network at
 * construction, so static imports are safe.
 */
export function getAIProvider(): AIProvider {
  switch (process.env.AI_PROVIDER) {
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
    default:
      return new GeminiProvider();
  }
}

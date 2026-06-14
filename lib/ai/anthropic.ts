import { AIProviderError, type AIProvider, type SynthResult } from "./provider";

/**
 * Dormant Anthropic provider (CLAUDE.md §10.0). The interface is wired so flipping
 * to real Claude later is a 3-step change (set AI_PROVIDER=anthropic, add
 * ANTHROPIC_API_KEY + credits, `npm i @anthropic-ai/sdk` and implement below).
 * Until then it fails loudly rather than silently.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async synthesize(): Promise<SynthResult> {
    throw new AIProviderError(
      "Anthropic provider is not configured in this build. Set AI_PROVIDER=gemini, or wire @anthropic-ai/sdk to enable Claude.",
    );
  }
}

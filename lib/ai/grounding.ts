/**
 * Evidence-grounding guard (CLAUDE.md §10.2). Pure: the server validates every
 * cited evidence id against the ids that actually exist for the workspace, strips
 * unknowns, and sanitizes any inline [id] tokens the model invented.
 */
export interface CitationResult {
  cleanSummary: string;
  validCited: string[];
  strippedCount: number;
}

export function validateCitations(
  summary: string,
  citedEvidenceIds: string[],
  validIds: string[],
): CitationResult {
  const valid = new Set(validIds);

  // 1. Keep only cited ids that exist (dedup, preserve order).
  const seen = new Set<string>();
  const validCited: string[] = [];
  let strippedCount = 0;
  for (const id of citedEvidenceIds) {
    if (valid.has(id)) {
      if (!seen.has(id)) {
        seen.add(id);
        validCited.push(id);
      }
    } else {
      strippedCount += 1;
    }
  }

  // 2. Sanitize inline [id] tokens in the prose: replace unknown ids with a flag.
  const cleanSummary = summary.replace(/\[([^\]\s]+)\]/g, (match, token: string) => {
    if (valid.has(token)) return match;
    strippedCount += 1;
    return "[unsupported]";
  });

  return { cleanSummary, validCited, strippedCount };
}

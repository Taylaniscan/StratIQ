import pptxgen from "pptxgenjs";

import type { StrategyPack } from "@/lib/domain/strategyPack";

const INK = "18181B";
const MUTED = "71717A";

/** Executive deck: title, summary, positioning, options, evidence. */
export async function toPptxBuffer(pack: StrategyPack): Promise<Buffer> {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";

  // Title
  const title = pptx.addSlide();
  title.addText(pack.title, { x: 0.5, y: 1.6, w: 12, h: 1, fontSize: 34, bold: true, color: INK });
  title.addText(
    `${pack.tenantName}  ·  ${pack.orgTier} · ${pack.archetype} · ${pack.maturity}`,
    { x: 0.5, y: 2.6, w: 12, h: 0.5, fontSize: 16, color: MUTED },
  );
  if (pack.taxonomy) {
    title.addText(pack.taxonomy, { x: 0.5, y: 3.1, w: 12, h: 0.4, fontSize: 12, color: MUTED });
  }

  // Executive summary
  if (pack.aiSummary) {
    const s = pptx.addSlide();
    s.addText("Executive summary", { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true, color: INK });
    s.addText(pack.aiSummary.output, { x: 0.5, y: 1.2, w: 12, h: 5.5, fontSize: 13, color: INK });
  }

  // Positioning
  if (pack.positioning) {
    const s = pptx.addSlide();
    s.addText("Positioning", { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true, color: INK });
    s.addText(
      `${pack.positioning.quadrant}  (supply risk ${pack.positioning.supplyRisk}, business impact ${pack.positioning.businessImpact})`,
      { x: 0.5, y: 1.3, w: 12, h: 0.5, fontSize: 16, bold: true, color: INK },
    );
    s.addText(pack.positioning.posture, { x: 0.5, y: 1.9, w: 12, h: 0.6, fontSize: 14, color: MUTED });
    if (pack.positioning.rationale) {
      s.addText(pack.positioning.rationale, { x: 0.5, y: 2.6, w: 12, h: 3, fontSize: 12, color: INK });
    }
  }

  // Options
  if (pack.options.length > 0) {
    const s = pptx.addSlide();
    s.addText("Strategy options", { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true, color: INK });
    const rows: pptxgen.TableRow[] = [
      ["Option", "Weighted score", "NPV (base)"].map((t) => ({
        text: t,
        options: { bold: true, color: INK },
      })),
      ...pack.options.map((o) => [
        { text: `${o.label}${o.isBaseline ? " (baseline)" : ""}${o.isSelected ? " ★" : ""}` },
        { text: String(o.score) },
        { text: o.npv },
      ]),
    ];
    s.addTable(rows, { x: 0.5, y: 1.2, w: 12, fontSize: 12, border: { type: "solid", color: "E4E4E7", pt: 1 } });
  }

  // Evidence
  if (pack.evidence.length > 0) {
    const s = pptx.addSlide();
    s.addText(`Evidence (${pack.evidence.length})`, { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 22, bold: true, color: INK });
    s.addText(
      pack.evidence.map((e) => ({
        text: `${e.claim}  —  ${e.sourceType}, ${e.confidence.toLowerCase()}, ${e.collectedAt}`,
        options: { bullet: true, fontSize: 12, color: INK },
      })),
      { x: 0.5, y: 1.2, w: 12, h: 5.5 },
    );
  }

  const out = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return out;
}

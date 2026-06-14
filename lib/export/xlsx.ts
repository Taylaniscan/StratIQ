import * as XLSX from "xlsx";

import type { StrategyPack } from "@/lib/domain/strategyPack";

/** Workbook export: Overview / Options / Suppliers / Evidence sheets. */
export function toXlsxBuffer(pack: StrategyPack): Buffer {
  const wb = XLSX.utils.book_new();

  const overview = XLSX.utils.aoa_to_sheet([
    ["StratIQ category strategy"],
    ["Category", pack.title],
    ["Organization", pack.tenantName],
    ["Org tier", pack.orgTier],
    ["Archetype", pack.archetype],
    ["Maturity", pack.maturity],
    ["Status", pack.status],
    ["Taxonomy", pack.taxonomy],
    ["Objective", pack.objective ?? ""],
    ["Frameworks", pack.frameworks.join(", ")],
    ["Generated", pack.generatedAt],
    [],
    ["Positioning", pack.positioning ? pack.positioning.quadrant : "Not positioned"],
    ["Posture", pack.positioning?.posture ?? ""],
  ]);
  XLSX.utils.book_append_sheet(wb, overview, "Overview");

  const optionRows = [
    ["Option", "Baseline", "Selected", "Weighted score", "NPV (base)"],
    ...pack.options.map((o) => [
      o.label,
      o.isBaseline ? "Yes" : "",
      o.isSelected ? "Yes" : "",
      o.score,
      o.npv,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(optionRows), "Options");

  if (pack.spend) {
    const supplierRows = [
      ["Supplier", "Spend"],
      ...pack.spend.topSuppliers.map((s) => [s.name, s.amount]),
      [],
      ["Total", pack.spend.total],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(supplierRows), "Suppliers");
  }

  const evidenceRows = [
    ["Claim", "Source", "Confidence", "Collected"],
    ...pack.evidence.map((e) => [e.claim, e.sourceType, e.confidence, e.collectedAt]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(evidenceRows), "Evidence");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

import { parseAmountToMinor } from "../money";

import type { ParsedSpendRow } from "./parse";

/** Deterministic sample spend so the cube is demoable without preparing a file. */
export function buildSampleSpendRows(): ParsedSpendRow[] {
  const suppliers = [
    { name: "Sodexo", bu: "Operations", site: "London", base: 42000 },
    { name: "CBRE", bu: "Corporate", site: "Frankfurt", base: 31000 },
    { name: "ISS Facility", bu: "Manufacturing", site: "Chicago", base: 58000 },
    { name: "Aramark", bu: "Operations", site: "London", base: 19000 },
    { name: "JLL", bu: "Corporate", site: "Frankfurt", base: 23000 },
  ];
  const months = [
    "2025-09", "2025-10", "2025-11", "2025-12",
    "2026-01", "2026-02", "2026-03", "2026-04",
  ];

  const rows: ParsedSpendRow[] = [];
  months.forEach((m, mi) => {
    suppliers.forEach((s, si) => {
      const amount = s.base + ((mi * 7 + si * 13) % 11) * 900;
      rows.push({
        supplier: s.name,
        amountMinor: parseAmountToMinor(amount),
        currency: "USD",
        glDate: new Date(`${m}-15T00:00:00Z`),
        buUnit: s.bu,
        site: s.site,
        classification: "Facilities",
        contractId: null,
      });
    });
  });
  return rows;
}

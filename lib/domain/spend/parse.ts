import Papa from "papaparse";
import * as XLSX from "xlsx";

import { parseAmountToMinor } from "../money";

export interface ParsedSpendRow {
  supplier: string | null;
  amountMinor: bigint;
  currency: string;
  glDate: Date;
  buUnit: string | null;
  site: string | null;
  classification: string | null;
  contractId: string | null;
}

export interface RowError {
  row: number; // 1-based data row (excludes header)
  message: string;
}

export interface ParseResult {
  rows: ParsedSpendRow[];
  errors: RowError[];
}

// Canonical field -> accepted header aliases (lower-cased, trimmed).
const HEADER_ALIASES: Record<string, string[]> = {
  supplier: ["supplier", "vendor", "supplier name", "vendor name"],
  amount: ["amount", "spend", "value", "total", "amount usd"],
  currency: ["currency", "ccy"],
  date: ["date", "gl date", "gldate", "posting date", "invoice date", "period"],
  businessUnit: ["business unit", "businessunit", "bu", "department", "cost center"],
  site: ["site", "location", "plant", "region", "geo"],
  category: ["category", "classification", "spend category", "gl category"],
  contractId: ["contract", "contract id", "contractid", "contract ref"],
};

export const SPEND_TEMPLATE_HEADERS = [
  "supplier",
  "amount",
  "currency",
  "date",
  "businessUnit",
  "site",
  "category",
  "contractId",
];

function norm(s: string) {
  return s.trim().toLowerCase().replace(/_/g, " ");
}

/** Map raw headers to canonical field -> raw key. */
function mapHeaders(rawHeaders: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const raw of rawHeaders) {
    const n = norm(raw);
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(n)) {
        map[canonical] = raw;
        break;
      }
    }
  }
  return map;
}

function readRecords(data: ArrayBuffer, filename: string): Record<string, unknown>[] {
  const u8 = new Uint8Array(data);
  if (/\.(xlsx|xls)$/i.test(filename)) {
    const wb = XLSX.read(u8, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
  }
  // default: CSV
  const text = new TextDecoder().decode(u8);
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function parseSpendFile(data: ArrayBuffer, filename: string): ParseResult {
  const records = readRecords(data, filename);
  const rows: ParsedSpendRow[] = [];
  const errors: RowError[] = [];

  if (records.length === 0) {
    return { rows, errors: [{ row: 0, message: "No rows found in file" }] };
  }

  const headerMap = mapHeaders(Object.keys(records[0] ?? {}));
  if (!headerMap.amount || !headerMap.date) {
    return {
      rows,
      errors: [{ row: 0, message: "File must include 'amount' and 'date' columns" }],
    };
  }

  const get = (rec: Record<string, unknown>, field: string) =>
    headerMap[field] ? rec[headerMap[field]] : null;

  records.forEach((rec, i) => {
    const rowNum = i + 1;
    try {
      const rawAmount = str(get(rec, "amount"));
      if (rawAmount === null) throw new Error("Missing amount");
      const amountMinor = parseAmountToMinor(rawAmount);

      const rawDate = str(get(rec, "date"));
      if (rawDate === null) throw new Error("Missing date");
      const glDate = new Date(rawDate);
      if (Number.isNaN(glDate.getTime())) throw new Error(`Unparseable date: ${rawDate}`);

      rows.push({
        supplier: str(get(rec, "supplier")),
        amountMinor,
        currency: (str(get(rec, "currency")) ?? "USD").toUpperCase(),
        glDate,
        buUnit: str(get(rec, "businessUnit")),
        site: str(get(rec, "site")),
        classification: str(get(rec, "category")),
        contractId: str(get(rec, "contractId")),
      });
    } catch (e) {
      errors.push({ row: rowNum, message: e instanceof Error ? e.message : "Invalid row" });
    }
  });

  return { rows, errors };
}

/**
 * Money helpers. All money is stored as integer **minor units** (e.g. cents) in a
 * `bigint` plus an ISO currency code — never floats (CLAUDE.md §4). v1 assumes
 * 2-decimal currencies for parsing; refine per-currency exponents later.
 */

/** Parse a human/sheet amount ("$1,234.56", "(500)", 1000) into minor units. */
export function parseAmountToMinor(input: string | number): bigint {
  let s = typeof input === "number" ? input.toString() : input.trim();
  if (s === "") throw new Error("Empty amount");

  let negative = false;
  // Accounting-style negatives: (1,234.56)
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  // Strip everything except digits, dot, and minus.
  s = s.replace(/[^0-9.\-]/g, "");
  if (s.includes("-")) {
    negative = true;
    s = s.replace(/-/g, "");
  }
  if (s === "" || s === ".") throw new Error(`Invalid amount: ${input}`);

  const [intPart = "0", fracRaw = ""] = s.split(".");
  const frac = (fracRaw + "00").slice(0, 2);
  const minor = BigInt(intPart || "0") * 100n + BigInt(frac || "0");
  return negative ? -minor : minor;
}

/** Minor units → a plain number in major units (for charts; loses bigint precision). */
export function minorToNumber(amountMinor: bigint): number {
  return Number(amountMinor) / 100;
}

/** Format minor units as a localized currency string. */
export function formatMinor(amountMinor: bigint, currency: string): string {
  const major = minorToNumber(amountMinor);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

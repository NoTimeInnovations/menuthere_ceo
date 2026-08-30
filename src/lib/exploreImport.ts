// The exact header row of a Zomato export. If the uploaded sheet's headers don't
// match this (order included), the import is rejected — that's the guard the CEO
// asked for so a changed export format surfaces as an error instead of silently
// importing garbage.
export const EXPECTED_HEADERS = [
  "#",
  "Restaurant Name",
  "Address",
  "Restaurant Number (Google Maps)",
  "Zomato Phone Numbers",
  "Ratings",
  "Specialties",
  "Link",
] as const;

// Columns we actually keep.
const NAME_COL = "Restaurant Name";
const GOOGLE_PHONE_COL = "Restaurant Number (Google Maps)";
const ZOMATO_PHONE_COL = "Zomato Phone Numbers";
const LINK_COL = "Link";

export type ExploreImportRow = {
  name: string;
  phone: string;
  zomatoLink: string;
};

export type ParseResult =
  | { ok: true; rows: ExploreImportRow[] }
  | { ok: false; error: string };

// Last 10 digits — used only to dedupe numbers that appear in both the Google
// Maps and Zomato columns in different formats (e.g. "8891030111" vs
// "+918891030111").
function phoneKey(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.slice(-10) || raw.trim();
}

// Merge the two phone sources into one column. Zomato may pack two numbers into
// a single cell separated by " | " — split those out. Duplicates (across the two
// columns) are collapsed; the Zomato form (with +91) wins because it's listed
// first when present.
export function mergePhones(googleNumber: string, zomatoNumbers: string): string {
  const parts: string[] = [];
  for (const p of String(zomatoNumbers ?? "").split("|")) {
    const t = p.trim();
    if (t) parts.push(t);
  }
  const g = String(googleNumber ?? "").trim();
  if (g) parts.push(g);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = phoneKey(p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out.join(", ");
}

function headersMatch(actual: string[]): boolean {
  if (actual.length !== EXPECTED_HEADERS.length) return false;
  return EXPECTED_HEADERS.every((h, i) => (actual[i] ?? "").trim() === h);
}

function describeHeaderMismatch(actual: string[]): string {
  const missing = EXPECTED_HEADERS.filter(
    (h) => !actual.some((a) => a.trim() === h),
  );
  const extra = actual.filter(
    (a) => a.trim() && !EXPECTED_HEADERS.some((h) => h === a.trim()),
  );
  const bits: string[] = [];
  if (missing.length) bits.push(`missing column(s): ${missing.join(", ")}`);
  if (extra.length) bits.push(`unexpected column(s): ${extra.join(", ")}`);
  if (!bits.length) bits.push("column order differs from the expected export");
  return `The sheet headers don't match a Zomato export — ${bits.join("; ")}.`;
}

// Parse an uploaded .xlsx/.xls/.csv file. Validates the header row, then maps
// each data row to the three fields we keep.
export async function parseExploreFile(file: File): Promise<ParseResult> {
  let rowsAoA: unknown[][];
  try {
    // Lazy-load the (heavy) xlsx parser only when an import actually happens,
    // so it lands in its own chunk instead of the main bundle.
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { ok: false, error: "The file has no sheets." };
    const ws = wb.Sheets[sheetName];
    rowsAoA = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Could not read the file. Is it a valid Excel/CSV file?" };
  }

  if (rowsAoA.length === 0) return { ok: false, error: "The sheet is empty." };

  const header = (rowsAoA[0] as unknown[]).map((c) => String(c ?? ""));
  if (!headersMatch(header)) {
    return { ok: false, error: describeHeaderMismatch(header) };
  }

  const idx = (col: string) => EXPECTED_HEADERS.indexOf(col as never);
  const nameIdx = idx(NAME_COL);
  const googleIdx = idx(GOOGLE_PHONE_COL);
  const zomatoIdx = idx(ZOMATO_PHONE_COL);
  const linkIdx = idx(LINK_COL);

  const rows: ExploreImportRow[] = [];
  for (let i = 1; i < rowsAoA.length; i++) {
    const r = rowsAoA[i] as unknown[];
    const name = String(r[nameIdx] ?? "").trim();
    if (!name) continue; // skip blank/trailing rows
    rows.push({
      name,
      phone: mergePhones(
        String(r[googleIdx] ?? ""),
        String(r[zomatoIdx] ?? ""),
      ),
      zomatoLink: String(r[linkIdx] ?? "").trim(),
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "No restaurant rows found in the sheet." };
  }
  return { ok: true, rows };
}

// Colour bucket for the "next date to call" cell.
//   overdue -> red, within the next hour -> yellow, otherwise normal.
export type CallDateTone = "overdue" | "soon" | "normal";

export function callDateTone(
  nextCallAt: number | undefined,
  now: number,
): CallDateTone {
  if (!nextCallAt) return "normal";
  if (nextCallAt < now) return "overdue";
  if (nextCallAt - now <= 60 * 60 * 1000) return "soon";
  return "normal";
}

export const FUNDING_TYPE_NAMES = [
  "2105 Perolehan Aset",
  "2106 Penyelenggaraan dan Pembaikan Aset",
  "2107 Bekalan dan Bahan Guna Habis",
  "2108 Teknologi Maklumat dan Infokomunikasi",
  "2109 Perkhidmatan",
  "2111 Utiliti",
  "2113 Sambutan dan Perayaan Kebangsaan",
  "2130 Kediaman Rasmi",
  "2133 Perkhidmatan Rampaian",
] as const;

export type FundingTypeName = (typeof FUNDING_TYPE_NAMES)[number];

/** Department budget funding types (2105–2113); excludes 2130 and 2133. */
export const DEPARTMENT_FUNDING_TYPE_NAMES = FUNDING_TYPE_NAMES.filter(
  (name) => !["2130 Kediaman Rasmi", "2133 Perkhidmatan Rampaian"].includes(name)
) as readonly FundingTypeName[];

/** Funding types whose department approved amount is split equally across all units. */
export const EQUAL_SPLIT_UNIT_FUNDING_TYPE_CODES = new Set(["2106"]);

export function fundingTypeCode(name: string): string {
  return name.slice(0, 4);
}

export function fundingTypeLabel(name: string): string {
  return name.slice(5).trim() || name;
}

/** Chart colors aligned with `DEPARTMENT_FUNDING_TYPE_NAMES` order. */
export const DEPARTMENT_FUNDING_TYPE_COLORS = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#4f46e5",
] as const;

export function departmentFundingTypeColor(code: string): string {
  const index = DEPARTMENT_FUNDING_TYPE_NAMES.findIndex(
    (name) => fundingTypeCode(name) === code
  );
  return DEPARTMENT_FUNDING_TYPE_COLORS[index >= 0 ? index : 0];
}

const LEGACY_FUNDING_TYPE_MAP: Record<string, FundingTypeName> = {
  "DTS Allocation": "2109 Perkhidmatan",
  GOBRN: "2105 Perolehan Aset",
};

export function mapLegacyFundingTypeName(name: string): FundingTypeName | null {
  return LEGACY_FUNDING_TYPE_MAP[name] ?? null;
}

export function sortFundingTypes<T extends { name: string }>(types: T[]): T[] {
  const order = new Map<string, number>(
    FUNDING_TYPE_NAMES.map((name, index) => [name, index])
  );
  return [...types].sort(
    (a, b) => (order.get(a.name) ?? 999) - (order.get(b.name) ?? 999)
  );
}

/** Default funding type for sample / migrated departmental projects. */
export const DEFAULT_DEPARTMENTAL_FUNDING_TYPE: FundingTypeName =
  "2109 Perkhidmatan";

/** Default funding type for sample / migrated capital / GOBRN-style projects. */
export const DEFAULT_CAPITAL_FUNDING_TYPE: FundingTypeName = "2105 Perolehan Aset";

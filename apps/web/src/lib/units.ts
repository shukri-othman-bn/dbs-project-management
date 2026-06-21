export const UNIT_CODES = [
  "BM1",
  "BM2",
  "BM3",
  "BM4",
  "BM5",
  "BM6",
  "BM7",
  "BM8",
  "BM9",
  "BM10",
  "IMU1",
  "IMU2",
  "IMU3",
  "UMR",
  "UAB",
] as const;

export const LEGACY_SECTION_CODES = ["SEC-A", "SEC-B", "SEC-C"] as const;

export type UnitCode = (typeof UNIT_CODES)[number];

export function getUnitLabel(section: {
  code?: string | null;
  unitLabel?: string | null;
  name: string;
} | null | undefined): string | null {
  if (!section) return null;
  return section.code ?? section.unitLabel ?? section.name;
}

export function sortUnitCodes(codes: string[]): string[] {
  const order = new Map<string, number>(UNIT_CODES.map((code, index) => [code, index]));
  return [...codes].sort((a, b) => {
    const aIndex = order.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = order.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b);
  });
}

export function defaultUnitAllocation(code: string): number {
  return code.startsWith("IMU") ? 250_000 : 400_000;
}

export type UnitSectionOption = {
  id: string;
  name: string;
  code?: string | null;
  unitLabel?: string | null;
  headName?: string | null;
  headEmail?: string | null;
};

export function formatUnitOptionLabel(section: UnitSectionOption): string {
  const code = getUnitLabel(section) ?? section.name;
  if (section.headName) return `${code} — ${section.headName}`;
  return code;
}

export function defaultUnitHead(code: string) {
  const slug = code.toLowerCase();
  return {
    headName: `Head of ${code}`,
    headEmail: `hou.${slug}@dbs.gov.bn`,
  };
}

export function sortSectionsForForm<T extends UnitSectionOption>(sections: T[]): T[] {
  const allowed = new Set<string>(UNIT_CODES);
  const order = new Map<string, number>(UNIT_CODES.map((code, index) => [code, index]));

  return sections
    .filter((section) => allowed.has(getUnitLabel(section) ?? ""))
    .sort((a, b) => {
      const aCode = getUnitLabel(a) ?? "";
      const bCode = getUnitLabel(b) ?? "";
      return (order.get(aCode) ?? 999) - (order.get(bCode) ?? 999);
    });
}

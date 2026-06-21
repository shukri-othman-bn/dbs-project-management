const MONTH_DAYS = 30;
const WEEK_DAYS = 7;

/** Parse free-text durations (e.g. "50 days", "3 months", "2 months and 10 days") to days. */
export function parseDurationToDays(text: string | null | undefined): number | null {
  if (!text?.trim()) return null;

  const normalized = text.trim().toLowerCase().replace(/\band\b/g, " ");
  let totalDays = 0;
  let matched = false;

  const unitPatterns: { regex: RegExp; factor: number }[] = [
    { regex: /(\d+(?:\.\d+)?)\s*months?/g, factor: MONTH_DAYS },
    { regex: /(\d+(?:\.\d+)?)\s*weeks?/g, factor: WEEK_DAYS },
    { regex: /(\d+(?:\.\d+)?)\s*days?/g, factor: 1 },
  ];

  for (const { regex, factor } of unitPatterns) {
    for (const match of normalized.matchAll(regex)) {
      totalDays += parseFloat(match[1]) * factor;
      matched = true;
    }
  }

  if (!matched) {
    const digits = normalized.match(/(\d+(?:\.\d+)?)/);
    if (digits) {
      return parseFloat(digits[1]);
    }
    return null;
  }

  return totalDays;
}

export function computeDurationPercent(
  periodText: string | null | undefined,
  originalDurationText: string | null | undefined
): number | null {
  const periodDays = parseDurationToDays(periodText);
  const originalDays = parseDurationToDays(originalDurationText);
  if (periodDays == null || originalDays == null || originalDays === 0) {
    return null;
  }
  return (periodDays / originalDays) * 100;
}

export function parseYearParam(
  yearParam: string | undefined,
): number | null {
  if (!yearParam || yearParam === "all") return null;
  const parsed = parseInt(yearParam, 10);
  if (isNaN(parsed) || parsed < 1900 || parsed > 2100) return null;
  return parsed;
}

export function buildDateTimeFilter(
  year: number | null,
): { gte: Date; lt: Date } | undefined {
  if (year === null) return undefined;
  return {
    gte: new Date(`${year}-01-01T00:00:00.000Z`),
    lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
  };
}

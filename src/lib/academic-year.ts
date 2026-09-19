/**
 * Academic years run August–July and are always derived from a date, never
 * hardcoded, per spec.md §7. Returned as e.g. "2026/2027".
 */
export function academicYearFor(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed; 7 = August
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}/${startYear + 1}`
}

export function currentAcademicYear(): string {
  return academicYearFor(new Date())
}

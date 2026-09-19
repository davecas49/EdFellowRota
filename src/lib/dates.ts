import { format } from 'date-fns'

/** UK-style date, e.g. 18/09/2026. */
export function formatUkDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy')
}

export function formatUkDateTime(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

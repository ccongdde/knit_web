const pad = (n: number) => String(n).padStart(2, '0')

/** 2025-10-01T… → "2025.10" */
export function formatYearMonth(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}`
}

/** 2025-10-01T… → "2025.10.01" */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

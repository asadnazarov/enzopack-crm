export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} сум`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function startOfMonthISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

/** Extracts a readable message from any thrown value, including Supabase's
 * PostgrestError (a plain object with .message, not an Error instance). */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return String(error)
}

/** Preview of the 3-digit code the DB trigger will assign to the next new product. */
export function nextProductCodePreview(products: { code: string }[]): string {
  const max = products.reduce((acc, p) => {
    const n = Number(p.code)
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return String(max + 1).padStart(3, '0')
}

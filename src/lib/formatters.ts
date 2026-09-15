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

export function formatDateTimeTashkent(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tashkent',
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

/**
 * Postgres error code 23503 = foreign_key_violation. Several tables use
 * `on delete restrict` on purpose (orders/deliveries/BOM must not silently
 * lose their material/product/client) — this turns that into a message a
 * user can act on instead of a raw constraint name.
 */
export function getDeleteErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? (error as { code: unknown }).code : undefined
  if (code === '23503') {
    return 'Нельзя удалить — запись уже используется в других данных (заказах, рецептах товаров, поставках и т.п.). Сначала уберите эти связи, потом удаление станет доступно.'
  }
  return getErrorMessage(error)
}

/** Preview of the 3-digit code the DB trigger will assign to the next new product. */
export function nextProductCodePreview(products: { code: string }[]): string {
  const max = products.reduce((acc, p) => {
    const n = Number(p.code)
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return String(max + 1).padStart(3, '0')
}

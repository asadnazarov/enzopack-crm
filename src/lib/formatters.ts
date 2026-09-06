export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(value)} сум`
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

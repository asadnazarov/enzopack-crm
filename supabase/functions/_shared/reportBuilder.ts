import { createClient } from 'jsr:@supabase/supabase-js@2'

function supabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, key)
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(n)
}

function formatMoney(n: number): string {
  return `${formatNumber(n)} сум`
}

export type ReportRange = 'today' | 'week' | 'month' | { from: string; to: string }

function resolveRange(range: ReportRange): { from: string; to: string; label: string } {
  const today = new Date()
  const toISO = (d: Date) => d.toISOString().slice(0, 10)

  if (typeof range === 'object') {
    return { from: range.from, to: range.to, label: `${range.from} — ${range.to}` }
  }
  if (range === 'today') {
    return { from: toISO(today), to: toISO(today), label: 'за сегодня' }
  }
  if (range === 'week') {
    const from = new Date(today)
    from.setDate(from.getDate() - 7)
    return { from: toISO(from), to: toISO(today), label: 'за неделю' }
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from: toISO(from), to: toISO(today), label: 'за месяц' }
}

export async function buildReport(range: ReportRange): Promise<string> {
  const supabase = supabaseAdmin()
  const { from, to, label } = resolveRange(range)

  const { data: kpi, error: kpiError } = await supabase
    .rpc('dashboard_kpi', { p_from: from, p_to: to })
    .single()
  if (kpiError) throw kpiError

  const { data: shortages, error: shortageError } = await supabase
    .from('v_material_shortage')
    .select('*')
    .eq('is_short', true)
    .order('shortage_qty', { ascending: false })
    .limit(5)
  if (shortageError) throw shortageError

  const lines = [
    `<b>EnzoPack — отчёт ${label}</b>`,
    `Период: ${from} — ${to}`,
    '',
    `📦 Изготовлено: <b>${formatNumber(Number(kpi.produced_qty))} шт</b>`,
    `🧾 Заказов: <b>${formatNumber(Number(kpi.orders_count))}</b> (активных: ${formatNumber(Number(kpi.active_orders))})`,
    `💰 Выручка: <b>${formatMoney(Number(kpi.revenue))}</b>`,
  ]

  if (shortages && shortages.length > 0) {
    lines.push('', '⚠️ <b>Дефицит сырья:</b>')
    for (const m of shortages) {
      lines.push(`  • #${m.code} ${m.name}: не хватает ${formatNumber(Number(m.shortage_qty))} ${m.unit}`)
    }
  } else {
    lines.push('', '✅ Дефицита сырья нет')
  }

  return lines.join('\n')
}

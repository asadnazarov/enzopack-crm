import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatNumber } from '../../lib/formatters'
import type { ProductionTrendPoint } from '../../types/db'

export function ProductionTrendChart({ data }: { data: ProductionTrendPoint[] }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 h-72">
      <div className="text-sm font-medium text-brand-ink mb-3">Производство по дням</div>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e4de" />
          <XAxis dataKey="day" tickFormatter={(v) => formatDate(v)} fontSize={12} stroke="#6b6b6b" />
          <YAxis fontSize={12} stroke="#6b6b6b" />
          <Tooltip
            formatter={(value) => [`${formatNumber(Number(value))} шт`, 'Изготовлено']}
            labelFormatter={(v) => formatDate(v as string)}
          />
          <Line type="monotone" dataKey="produced_qty" stroke="#ffb100" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

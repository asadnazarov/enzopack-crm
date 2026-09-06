import { formatNumber } from '../../lib/formatters'
import type { MaterialShortage } from '../../types/db'

export function ShortageTopWidget({ data }: { data: MaterialShortage[] }) {
  const shortages = data.filter((m) => m.is_short)

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 h-72 overflow-y-auto">
      <div className="text-sm font-medium text-brand-ink mb-3">Дефицит сырья</div>
      {shortages.length === 0 ? (
        <div className="text-sm text-brand-gray-dark">Дефицита нет — всё сырьё в наличии</div>
      ) : (
        <div className="flex flex-col gap-2">
          {shortages.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span className="text-brand-ink">
                #{m.code} {m.name}
              </span>
              <span className="font-semibold text-red-600">
                −{formatNumber(Number(m.shortage_qty))} {m.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

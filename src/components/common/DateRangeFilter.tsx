import { daysAgoISO, startOfMonthISO, todayISO } from '../../lib/formatters'

export interface DateRange {
  from: string
  to: string
  label: string
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const PRESETS: DateRange[] = [
  { label: 'Сегодня', from: todayISO(), to: todayISO() },
  { label: 'Неделя', from: daysAgoISO(7), to: todayISO() },
  { label: 'Месяц', from: startOfMonthISO(), to: todayISO() },
]

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onChange(preset)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            value.label === preset.label
              ? 'bg-brand-yellow text-brand-black'
              : 'bg-white border border-brand-border text-brand-ink hover:bg-brand-gray'
          }`}
        >
          {preset.label}
        </button>
      ))}

      <div className="flex items-center gap-1 bg-white border border-brand-border rounded-full px-2 py-1">
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ label: 'Период', from: e.target.value, to: value.to })}
          className="text-sm outline-none bg-transparent"
        />
        <span className="text-brand-gray-dark text-sm">—</span>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ label: 'Период', from: value.from, to: e.target.value })}
          className="text-sm outline-none bg-transparent"
        />
      </div>
    </div>
  )
}

export const DEFAULT_DATE_RANGE = PRESETS[2]

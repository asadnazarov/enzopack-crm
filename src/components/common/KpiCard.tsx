interface KpiCardProps {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'warning'
}

export function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  return (
    <div
      className={`flex-1 min-w-[200px] rounded-2xl border p-5 shadow-sm ${
        tone === 'warning'
          ? 'bg-brand-yellow-light border-brand-yellow'
          : 'bg-white border-brand-border'
      }`}
    >
      <div className="text-sm text-brand-gray-dark font-medium">{label}</div>
      <div className="text-3xl font-bold text-brand-ink mt-1">{value}</div>
      {hint && <div className="text-xs text-brand-gray-dark mt-1">{hint}</div>}
    </div>
  )
}

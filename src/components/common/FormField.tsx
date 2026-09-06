import type { InputHTMLAttributes, ReactNode } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  suffix?: ReactNode
}

export function FormField({ label, error, suffix, className, ...rest }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-brand-ink">{label}</span>
      <div className="flex items-center gap-2">
        <input
          {...rest}
          className={`w-full border border-brand-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow-light transition ${className ?? ''}`}
        />
        {suffix}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

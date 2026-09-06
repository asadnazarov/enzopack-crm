import { AnimatePresence, motion } from 'framer-motion'
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from '../../types/db'

const STATUS_STYLES: Record<OrderStatus, string> = {
  processing: 'bg-brand-yellow-light text-brand-yellow-dark',
  in_progress: 'bg-blue-100 text-blue-700',
  ready: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

interface StatusBadgeProps {
  status: OrderStatus
  onAdvance?: () => void
  disabled?: boolean
}

export function StatusBadge({ status, onAdvance, disabled }: StatusBadgeProps) {
  const nextStatus = ORDER_STATUS_FLOW[(ORDER_STATUS_FLOW.indexOf(status) + 1) % ORDER_STATUS_FLOW.length]
  const canAdvance = status !== 'cancelled' && !!onAdvance

  return (
    <button
      type="button"
      disabled={!canAdvance || disabled}
      onClick={(e) => {
        e.stopPropagation()
        onAdvance?.()
      }}
      className={`relative overflow-hidden rounded-full px-3 py-1 text-xs font-semibold transition ${STATUS_STYLES[status]} ${
        canAdvance ? 'cursor-pointer hover:brightness-95 active:scale-95' : 'cursor-default opacity-90'
      }`}
      title={canAdvance ? `Перевести в «${ORDER_STATUS_LABELS[nextStatus]}»` : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-block"
        >
          {ORDER_STATUS_LABELS[status]}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

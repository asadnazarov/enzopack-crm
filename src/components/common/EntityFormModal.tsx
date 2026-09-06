import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface EntityFormModalProps {
  open: boolean
  onClose: () => void
  title: string
  photoSlot?: ReactNode
  children: ReactNode
  footer: ReactNode
  onDelete?: () => void
}

export function EntityFormModal({
  open,
  onClose,
  title,
  photoSlot,
  children,
  footer,
  onDelete,
}: EntityFormModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-xl max-h-[92vh] overflow-y-auto relative"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center text-brand-gray-dark hover:text-red-600 transition"
                aria-label="Удалить"
              >
                🗑
              </button>
            )}

            {photoSlot && <div className="p-4 pb-0">{photoSlot}</div>}

            <div className="p-4">
              <h2 className="text-lg font-semibold text-brand-ink mb-4">{title}</h2>
              <div className="flex flex-col gap-3">{children}</div>
              <div className="mt-5 flex justify-end gap-2">{footer}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

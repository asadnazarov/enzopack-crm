import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const SPLASH_DURATION = 2.4

export function IntroOverlay() {
  const [visible, setVisible] = useState(true)

  function dismiss() {
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-center gap-6 px-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src={`${import.meta.env.BASE_URL}intro-splash.jpg`}
            alt="EnzoPack"
            className="max-w-[min(640px,90vw)] w-full h-auto rounded-2xl shadow-2xl object-contain"
          />

          <div className="w-full max-w-xs flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/50">Загрузка</span>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand-yellow"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: SPLASH_DURATION, ease: 'easeInOut' }}
                onAnimationComplete={dismiss}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="absolute bottom-6 right-6 px-4 py-2 rounded-full bg-white/10 text-white text-sm backdrop-blur hover:bg-white/20 transition"
          >
            Пропустить
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

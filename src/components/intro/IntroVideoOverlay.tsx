import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

export function IntroVideoOverlay() {
  const [visible, setVisible] = useState(true)

  function dismiss() {
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-brand-black flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <video
            className="w-full h-full object-cover"
            src={`${import.meta.env.BASE_URL}intro-video.mp4`}
            poster={`${import.meta.env.BASE_URL}intro-poster.jpg`}
            preload="auto"
            autoPlay
            muted
            playsInline
            onEnded={dismiss}
          />
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

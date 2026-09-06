import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'enzopack_intro_seen'

export function IntroVideoOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <video
            className="w-full h-full object-cover"
            src={`${import.meta.env.BASE_URL}intro-video.mp4`}
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

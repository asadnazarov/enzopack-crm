import { useRef, useState } from 'react'
import { compressImage } from '../../lib/imageCompression'
import { MEDIA_BUCKET, publicMediaUrl, supabase } from '../../lib/supabaseClient'

interface PhotoUploaderProps {
  value: string | null
  onChange: (path: string | null) => void
  folder: string
}

export function PhotoUploader({ value, onChange, folder }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const previewUrl = publicMediaUrl(value)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const optimized = await compressImage(file)
      const ext = optimized.name.split('.').pop()
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, optimized, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error
      onChange(path)
    } catch (error) {
      alert(`Не удалось загрузить фото: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden bg-brand-gray border border-brand-border flex items-center justify-center group">
      {previewUrl ? (
        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-brand-gray-dark text-sm">Нет фото</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-brand-yellow text-brand-black flex items-center justify-center text-xl font-bold shadow-md hover:brightness-95 active:scale-95 transition"
        aria-label="Загрузить фото"
      >
        {uploading ? '…' : '+'}
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition"
          aria-label="Удалить фото"
        >
          ✕
        </button>
      )}
    </div>
  )
}

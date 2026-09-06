import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase не сконфигурирован: заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')

export const MEDIA_BUCKET = 'enzopack-media'

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

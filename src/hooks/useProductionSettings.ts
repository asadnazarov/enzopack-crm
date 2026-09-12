import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { ProductionSettings } from '../lib/calculator'

const KEY = ['production_settings']

export function useProductionSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('production_settings').select('settings').eq('id', 1).single()
      if (error) throw error
      return data.settings as ProductionSettings
    },
  })
}

export function useUpdateProductionSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settings: ProductionSettings) => {
      const { error } = await supabase.from('production_settings').update({ settings }).eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

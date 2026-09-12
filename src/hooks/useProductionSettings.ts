import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { getStarchPrice, type ProductionSettings } from '../lib/calculator'

const KEY = ['production_settings']

export const STARCH_GLUE_MATERIAL_NAME = 'Клей крахмальный (авто)'
export const LIQUID_GLUE_MATERIAL_NAME = 'Клей жидкое стекло (авто)'

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

export function useGlueMaterials() {
  return useQuery({
    queryKey: ['raw_materials', 'glue_ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, name, unit')
        .in('name', [STARCH_GLUE_MATERIAL_NAME, LIQUID_GLUE_MATERIAL_NAME])
      if (error) throw error
      const starch = data.find((m) => m.name === STARCH_GLUE_MATERIAL_NAME) ?? null
      const liquid = data.find((m) => m.name === LIQUID_GLUE_MATERIAL_NAME) ?? null
      return { starch, liquid }
    },
  })
}

export function useUpdateProductionSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (settings: ProductionSettings) => {
      const { error } = await supabase.from('production_settings').update({ settings }).eq('id', 1)
      if (error) throw error

      const starchPrice = getStarchPrice(settings.glue)
      const { error: starchError } = await supabase
        .from('raw_materials')
        .update({ unit_price: starchPrice })
        .eq('name', STARCH_GLUE_MATERIAL_NAME)
      if (starchError) throw starchError

      const { error: liquidError } = await supabase
        .from('raw_materials')
        .update({ unit_price: settings.glue.liquidPrice })
        .eq('name', LIQUID_GLUE_MATERIAL_NAME)
      if (liquidError) throw liquidError
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['raw_materials'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { MaterialShortage, RawMaterial } from '../types/db'

const KEY = ['raw_materials']

export function useRawMaterials(search?: string) {
  return useQuery({
    queryKey: [...KEY, search ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('raw_materials')
        .select('*, supplier:suppliers(id,name)')
        .order('code', { ascending: true })
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as RawMaterial[]
    },
  })
}

export function useMaterialShortage() {
  return useQuery({
    queryKey: ['material_shortage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_material_shortage')
        .select('*')
        .order('shortage_qty', { ascending: false })
      if (error) throw error
      return data as MaterialShortage[]
    },
  })
}

export type RawMaterialInput = Omit<
  RawMaterial,
  'id' | 'created_at' | 'updated_at' | 'supplier' | 'code'
> & { code?: string }

export function useUpsertRawMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<RawMaterialInput> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('raw_materials').update(rest).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await supabase
        .from('raw_materials')
        .insert(rest)
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['material_shortage'] })
    },
  })
}

export function useDeleteRawMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('raw_materials').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['material_shortage'] })
    },
  })
}

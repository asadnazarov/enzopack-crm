import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Die } from '../types/db'

const KEY = ['dies']

export function useDies() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dies')
        .select('*, for_product:finished_products(id,code,name)')
        .order('code', { ascending: true })
      if (error) throw error
      return data as Die[]
    },
  })
}

export type DieInput = Omit<Die, 'id' | 'created_at' | 'updated_at' | 'for_product' | 'code'> & { code?: string }

export function useUpsertDie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<DieInput> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('dies').update(rest).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await supabase.from('dies').insert(rest).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteDie() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dies').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

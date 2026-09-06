import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Client } from '../types/db'

const KEY = ['clients']

export function useClients() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Client[]
    },
  })
}

export type ClientInput = Omit<Client, 'id' | 'created_at' | 'updated_at'>

export function useUpsertClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<ClientInput> & { id?: string }) => {
      const { id, ...rest } = input
      if (id) {
        const { error } = await supabase.from('clients').update(rest).eq('id', id)
        if (error) throw error
        return id
      }
      const { data, error } = await supabase.from('clients').insert(rest).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

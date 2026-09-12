import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { TechCard } from '../types/db'

export function useClientProductHistory(clientId?: string, productId?: string) {
  return useQuery({
    queryKey: ['tech_cards', 'client_product_history', clientId, productId],
    enabled: !!clientId && !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tech_cards')
        .select('id, created_at, sale_price_vat')
        .eq('client_id', clientId)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Pick<TechCard, 'id' | 'created_at' | 'sale_price_vat'>[]
    },
  })
}

export function useTechCardByOrder(orderId?: string) {
  return useQuery({
    queryKey: ['tech_cards', 'by_order', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tech_cards')
        .select('*, die:dies(id,code,name)')
        .eq('order_id', orderId)
        .maybeSingle()
      if (error) throw error
      return data as TechCard | null
    },
  })
}

export function useTechCard(id?: string) {
  return useQuery({
    queryKey: ['tech_cards', 'by_id', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tech_cards')
        .select('*, die:dies(id,code,name)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as TechCard
    },
  })
}

export interface CreateTechCardInput {
  order_id: string
  client_id: string
  product_id: string
  die_id: string | null
  input_snapshot: Record<string, unknown>
  result_snapshot: Record<string, unknown>
  settings_snapshot: Record<string, unknown>
  total_cost: number
  unit_cost: number
  sale_price_vat: number
  margin_pct: number | null
}

export function useCreateTechCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTechCardInput) => {
      const { error } = await supabase.from('tech_cards').insert(input)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['tech_cards', 'by_order', variables.order_id] })
      qc.invalidateQueries({
        queryKey: ['tech_cards', 'client_product_history', variables.client_id, variables.product_id],
      })
    },
  })
}

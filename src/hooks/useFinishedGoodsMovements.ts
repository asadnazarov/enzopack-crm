import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { FinishedGoodsMovement } from '../types/db'

export function useFinishedGoodsMovements(productId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['finished_goods_movements', productId, from, to],
    enabled: !!productId,
    queryFn: async () => {
      let query = supabase
        .from('finished_goods_movements')
        .select('*')
        .eq('product_id', productId)
        .order('movement_date', { ascending: false })
      if (from) query = query.gte('movement_date', from)
      if (to) query = query.lte('movement_date', to)
      const { data, error } = await query
      if (error) throw error
      return data as FinishedGoodsMovement[]
    },
  })
}

export function useAllFinishedGoodsMovements(from?: string, to?: string) {
  return useQuery({
    queryKey: ['finished_goods_movements', 'all', from, to],
    queryFn: async () => {
      let query = supabase
        .from('finished_goods_movements')
        .select('*, product:finished_products(id,code,name)')
        .order('movement_date', { ascending: false })
      if (from) query = query.gte('movement_date', from)
      if (to) query = query.lte('movement_date', to)
      const { data, error } = await query
      if (error) throw error
      return data as (FinishedGoodsMovement & { product: { id: string; code: string; name: string } | null })[]
    },
  })
}

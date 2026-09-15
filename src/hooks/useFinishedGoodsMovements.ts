import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { FinishedGoodsMovement } from '../types/db'

// movement_date is a timestamptz, but the date-range filter only picks whole
// days — so the "to" bound needs to reach the end of that day, not its
// midnight start, or same-day events later than 00:00 would be excluded.
function endOfDayExclusive(to: string): string {
  const d = new Date(`${to}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

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
      if (to) query = query.lt('movement_date', endOfDayExclusive(to))
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
      if (to) query = query.lt('movement_date', endOfDayExclusive(to))
      const { data, error } = await query
      if (error) throw error
      return data as (FinishedGoodsMovement & { product: { id: string; code: string; name: string } | null })[]
    },
  })
}

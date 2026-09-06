import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Order, OrderStatus } from '../types/db'

const KEY = ['orders']

export function useOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: [...KEY, status ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, client:clients(id,name,company,logo_url), product:finished_products(id,code,name,photo_url)')
        .order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data as Order[]
    },
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      client_id: string
      product_id: string
      quantity: number
      delivery_date: string | null
      unit_price: number
      notes?: string
    }) => {
      const { data, error } = await supabase.rpc('create_order_with_consumption', {
        p_client_id: input.client_id,
        p_product_id: input.product_id,
        p_quantity: input.quantity,
        p_delivery_date: input.delivery_date,
        p_unit_price: input.unit_price,
        p_notes: input.notes ?? null,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['raw_materials'] })
      qc.invalidateQueries({ queryKey: ['material_shortage'] })
      qc.invalidateQueries({ queryKey: ['dashboard_kpi'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase.rpc('update_order_status', {
        p_order_id: input.orderId,
        p_new_status: input.status,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['raw_materials'] })
      qc.invalidateQueries({ queryKey: ['finished_products'] })
      qc.invalidateQueries({ queryKey: ['material_shortage'] })
      qc.invalidateQueries({ queryKey: ['dashboard_kpi'] })
      qc.invalidateQueries({ queryKey: ['production_trend'] })
    },
  })
}

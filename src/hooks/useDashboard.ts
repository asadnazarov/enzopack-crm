import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { DashboardKpi, MaterialShortage, ProductionTrendPoint } from '../types/db'

export function useDashboardKpi(from: string, to: string) {
  return useQuery({
    queryKey: ['dashboard_kpi', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('dashboard_kpi', { p_from: from, p_to: to })
        .single()
      if (error) throw error
      return data as DashboardKpi
    },
  })
}

export function useProductionTrend() {
  return useQuery({
    queryKey: ['production_trend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_production_trend')
        .select('*')
        .order('day', { ascending: true })
      if (error) throw error
      return data as ProductionTrendPoint[]
    },
  })
}

export function useShortageTop(limit = 5) {
  return useQuery({
    queryKey: ['material_shortage', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_material_shortage')
        .select('*')
        .order('shortage_qty', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as MaterialShortage[]
    },
  })
}

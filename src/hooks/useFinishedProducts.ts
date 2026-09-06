import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { FinishedProduct, ProductBomRow } from '../types/db'

const KEY = ['finished_products']

export function useFinishedProducts(search?: string) {
  return useQuery({
    queryKey: [...KEY, search ?? ''],
    queryFn: async () => {
      let query = supabase
        .from('finished_products')
        .select('*')
        .order('code', { ascending: true })
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as FinishedProduct[]
    },
  })
}

export function useProductBom(productId: string | undefined) {
  return useQuery({
    queryKey: ['product_bom', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bom')
        .select('*, raw_material:raw_materials(id,code,name,unit,stock_qty)')
        .eq('product_id', productId)
      if (error) throw error
      return data as ProductBomRow[]
    },
  })
}

export type FinishedProductInput = Omit<
  FinishedProduct,
  'id' | 'created_at' | 'updated_at' | 'code' | 'cost_price'
>

export interface BomLineInput {
  raw_material_id: string
  qty_per_unit: number
}

export function useUpsertProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id?: string
      product: Partial<FinishedProductInput>
      bom: BomLineInput[]
    }) => {
      let productId = input.id
      if (productId) {
        const { error } = await supabase
          .from('finished_products')
          .update(input.product)
          .eq('id', productId)
        if (error) throw error
        const { error: delError } = await supabase
          .from('product_bom')
          .delete()
          .eq('product_id', productId)
        if (delError) throw delError
      } else {
        const { data, error } = await supabase
          .from('finished_products')
          .insert(input.product)
          .select('id')
          .single()
        if (error) throw error
        productId = data.id as string
      }

      if (input.bom.length > 0) {
        const { error: bomError } = await supabase.from('product_bom').insert(
          input.bom.map((line) => ({ ...line, product_id: productId })),
        )
        if (bomError) throw bomError
      }

      return productId
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['product_bom', productId] })
      qc.invalidateQueries({ queryKey: ['raw_materials'] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finished_products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

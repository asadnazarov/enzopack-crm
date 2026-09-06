export type OrderStatus =
  | 'processing'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  processing: 'В обработке',
  in_progress: 'В процессе',
  ready: 'Готово',
  delivered: 'Доставлено',
  cancelled: 'Отменён',
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'processing',
  'in_progress',
  'ready',
  'delivered',
]

export interface Client {
  id: string
  name: string
  company: string | null
  phone: string | null
  logo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  supplies: string | null
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RawMaterial {
  id: string
  code: string
  name: string
  unit: string
  photo_url: string | null
  supplier_id: string | null
  unit_price: number
  stock_qty: number
  created_at: string
  updated_at: string
  supplier?: Pick<Supplier, 'id' | 'name'> | null
}

export interface FinishedProduct {
  id: string
  code: string
  name: string
  photo_url: string | null
  sale_price: number
  stock_qty: number
  cost_price: number
  created_at: string
  updated_at: string
}

export interface ProductBomRow {
  id: string
  product_id: string
  raw_material_id: string
  qty_per_unit: number
  raw_material?: Pick<RawMaterial, 'id' | 'code' | 'name' | 'unit' | 'stock_qty'>
}

export interface Order {
  id: string
  client_id: string
  product_id: string
  quantity: number
  delivery_date: string | null
  status: OrderStatus
  unit_price: number
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  client?: Pick<Client, 'id' | 'name' | 'company' | 'logo_url'>
  product?: Pick<FinishedProduct, 'id' | 'code' | 'name' | 'photo_url'>
}

export interface FinanceTransaction {
  id: string
  type: 'income' | 'expense'
  category: string | null
  amount: number
  related_order_id: string | null
  related_supplier_id: string | null
  related_client_id: string | null
  description: string | null
  transaction_date: string
  created_at: string
}

export interface SupplierDelivery {
  id: string
  supplier_id: string
  raw_material_id: string
  qty: number
  unit_price: number | null
  total_cost: number | null
  delivery_date: string
  created_at: string
}

export interface MaterialShortage {
  id: string
  code: string
  name: string
  unit: string
  stock_qty: number
  is_short: boolean
  shortage_qty: number
}

export interface ProductionTrendPoint {
  day: string
  produced_qty: number
}

export interface DashboardKpi {
  produced_qty: number
  orders_count: number
  active_orders: number
  revenue: number
  shortage_materials_count: number
}

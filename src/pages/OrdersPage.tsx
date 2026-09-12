import { useState } from 'react'
import { CalculatorOrderModal } from '../components/orders/CalculatorOrderModal'
import { OrderDetailModal } from '../components/orders/OrderDetailModal'
import { OrdersList } from '../components/orders/OrdersList'
import { useOrders, useUpdateOrderStatus } from '../hooks/useOrders'
import { ORDER_STATUS_FLOW } from '../types/db'
import type { Order } from '../types/db'

export function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders()
  const updateStatus = useUpdateOrderStatus()
  const [formOpen, setFormOpen] = useState(false)
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const openOrder = orders.find((o) => o.id === openOrderId) ?? null

  function handleAdvance(order: Order) {
    if (order.status === 'cancelled') return
    const nextIndex = (ORDER_STATUS_FLOW.indexOf(order.status) + 1) % ORDER_STATUS_FLOW.length
    updateStatus.mutate({ orderId: order.id, status: ORDER_STATUS_FLOW[nextIndex] })
  }

  function handleCancel(order: Order) {
    if (!confirm('Отменить заказ? Сырьё вернётся на склад.')) return
    updateStatus.mutate({ orderId: order.id, status: 'cancelled' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-ink">Заказы</h1>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 bg-brand-yellow text-brand-black font-semibold px-4 py-2 rounded-full shadow-sm hover:brightness-95 active:scale-95 transition"
        >
          <span className="text-lg leading-none">+</span> Заказ
        </button>
      </div>

      {isLoading ? (
        <div className="text-brand-gray-dark">Загрузка…</div>
      ) : (
        <OrdersList
          orders={orders}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
          onOpen={(order) => setOpenOrderId(order.id)}
        />
      )}

      <CalculatorOrderModal open={formOpen} onClose={() => setFormOpen(false)} />
      <OrderDetailModal order={openOrder} onClose={() => setOpenOrderId(null)} />
    </div>
  )
}

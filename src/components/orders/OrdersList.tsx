import { StatusBadge } from '../common/StatusBadge'
import { formatDate, formatMoney, formatNumber } from '../../lib/formatters'
import { ORDER_STATUS_FLOW } from '../../types/db'
import type { Order } from '../../types/db'
import { publicMediaUrl } from '../../lib/supabaseClient'

interface OrdersListProps {
  orders: Order[]
  onAdvance: (order: Order) => void
  onCancel: (order: Order) => void
}

export function OrdersList({ orders, onAdvance, onCancel }: OrdersListProps) {
  if (orders.length === 0) {
    return <div className="text-center text-brand-gray-dark py-16">Заказов пока нет</div>
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map((order) => {
        const photo = publicMediaUrl(order.product?.photo_url)
        const canCancel = order.status !== 'delivered' && order.status !== 'cancelled'
        return (
          <div
            key={order.id}
            className="flex items-center gap-3 bg-white border border-brand-border rounded-xl p-3"
          >
            <div className="w-12 h-12 rounded-lg bg-brand-gray overflow-hidden shrink-0 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-brand-gray-dark">#{order.product?.code}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-brand-ink truncate">
                {order.client?.name} {order.client?.company ? `· ${order.client.company}` : ''}
              </div>
              <div className="text-sm text-brand-gray-dark truncate">
                #{order.product?.code} {order.product?.name} · {formatNumber(Number(order.quantity))} шт
              </div>
            </div>

            <div className="hidden sm:block text-sm text-brand-gray-dark whitespace-nowrap">
              до {formatDate(order.delivery_date)}
            </div>

            <div className="hidden md:block text-sm font-medium text-brand-ink whitespace-nowrap">
              {formatMoney(Number(order.total_amount))}
            </div>

            <StatusBadge
              status={order.status}
              onAdvance={
                ORDER_STATUS_FLOW.indexOf(order.status) < ORDER_STATUS_FLOW.length - 1
                  ? () => onAdvance(order)
                  : undefined
              }
            />

            {canCancel && (
              <button
                type="button"
                onClick={() => onCancel(order)}
                className="text-brand-gray-dark hover:text-red-600 transition text-sm"
                title="Отменить заказ"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

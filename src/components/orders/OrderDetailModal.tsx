import { useEffect, useState } from 'react'
import { EntityFormModal } from '../common/EntityFormModal'
import { FormField } from '../common/FormField'
import { StatusBadge } from '../common/StatusBadge'
import { publicMediaUrl } from '../../lib/supabaseClient'
import { formatMoney, formatNumber, getErrorMessage } from '../../lib/formatters'
import { useClients } from '../../hooks/useClients'
import { useUpdateOrderDetails, useUpdateOrderStatus } from '../../hooks/useOrders'
import { useTechCardByOrder } from '../../hooks/useTechCards'
import { TechCardView } from '../techcards/TechCardView'
import { ORDER_STATUS_FLOW } from '../../types/db'
import type { Order } from '../../types/db'

interface OrderDetailModalProps {
  order: Order | null
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const { data: clients = [] } = useClients()
  const { data: techCard } = useTechCardByOrder(order?.id)
  const updateDetails = useUpdateOrderDetails()
  const updateStatus = useUpdateOrderStatus()

  const [clientId, setClientId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [unitPrice, setUnitPrice] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (order) {
      setClientId(order.client_id)
      setDeliveryDate(order.delivery_date ?? '')
      setUnitPrice(Number(order.unit_price))
      setNotes(order.notes ?? '')
    }
  }, [order])

  const isCancelled = order?.status === 'cancelled'
  const nextIndex = order ? (ORDER_STATUS_FLOW.indexOf(order.status) + 1) % ORDER_STATUS_FLOW.length : -1
  const canAdvance = !isCancelled && nextIndex >= 0

  async function handleSave() {
    if (!order) return
    try {
      await updateDetails.mutateAsync({
        orderId: order.id,
        client_id: clientId,
        delivery_date: deliveryDate || null,
        unit_price: unitPrice,
        notes: notes || null,
      })
      onClose()
    } catch (error) {
      alert(`Не удалось сохранить изменения: ${getErrorMessage(error)}`)
    }
  }

  async function handleAdvance() {
    if (!order || nextIndex < 0) return
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: ORDER_STATUS_FLOW[nextIndex] })
    } catch (error) {
      alert(`Не удалось изменить статус: ${getErrorMessage(error)}`)
    }
  }

  async function handleCancel() {
    if (!order) return
    if (!confirm('Отменить заказ? Сырьё вернётся на склад.')) return
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: 'cancelled' })
      onClose()
    } catch (error) {
      alert(`Не удалось отменить заказ: ${getErrorMessage(error)}`)
    }
  }

  const photo = publicMediaUrl(order?.product?.photo_url)

  return (
    <EntityFormModal
      open={!!order}
      onClose={onClose}
      title={`Заказ #${order?.product?.code ?? ''}`}
      photoSlot={
        photo ? (
          <div className="w-full h-32 rounded-xl overflow-hidden bg-brand-gray">
            <img src={photo} alt="" className="w-full h-full object-contain" />
          </div>
        ) : undefined
      }
      footer={
        <>
          {!isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition mr-auto"
            >
              Отменить заказ
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-brand-gray-dark hover:bg-brand-gray transition"
          >
            Закрыть
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateDetails.isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-yellow text-brand-black disabled:opacity-50 hover:brightness-95 transition"
          >
            Сохранить
          </button>
        </>
      }
    >
      {order && (
        <>
          <div className="flex items-center justify-between bg-brand-gray rounded-xl p-3">
            <div>
              <div className="text-sm font-semibold text-brand-ink">
                #{order.product?.code} {order.product?.name}
              </div>
              <div className="text-xs text-brand-gray-dark">
                {formatNumber(Number(order.quantity))} шт · {formatMoney(Number(order.total_amount))}
              </div>
            </div>
            <StatusBadge status={order.status} onAdvance={canAdvance ? handleAdvance : undefined} />
          </div>
          {isCancelled && (
            <div className="text-xs text-brand-gray-dark">
              Заказ отменён — статус больше не меняется.
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-brand-ink">Клиент</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="border border-brand-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-yellow"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Дата доставки"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
            <FormField
              label="Цена за единицу"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-brand-ink">Заметки</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border border-brand-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow-light transition resize-none"
            />
          </label>

          {techCard && (
            <div className="border-t border-brand-border pt-3">
              <div className="text-sm font-medium text-brand-ink mb-2">Техкарта</div>
              <TechCardView techCard={techCard} mode="management" />
            </div>
          )}
        </>
      )}
    </EntityFormModal>
  )
}

import { useState } from 'react'
import { CardListWithPhoto } from '../components/common/CardListWithPhoto'
import { EntityFormModal } from '../components/common/EntityFormModal'
import { FormField } from '../components/common/FormField'
import { PhotoUploader } from '../components/common/PhotoUploader'
import { formatDate, formatMoney, formatNumber, getErrorMessage } from '../lib/formatters'
import {
  useCreateDelivery,
  useDeleteSupplier,
  useSupplierDeliveries,
  useSuppliers,
  useUpsertSupplier,
} from '../hooks/useSuppliers'
import { useRawMaterials } from '../hooks/useRawMaterials'
import type { Supplier } from '../types/db'

const EMPTY: Partial<Supplier> = { name: '', phone: '', supplies: '', photo_url: null, notes: '' }

export function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers()
  const { data: materials = [] } = useRawMaterials()
  const upsert = useUpsertSupplier()
  const del = useDeleteSupplier()
  const createDelivery = useCreateDelivery()
  const [editing, setEditing] = useState<Partial<Supplier> | null>(null)
  const { data: deliveries = [] } = useSupplierDeliveries(editing?.id)

  const [deliveryMaterialId, setDeliveryMaterialId] = useState('')
  const [deliveryQty, setDeliveryQty] = useState(0)
  const [deliveryUnitPrice, setDeliveryUnitPrice] = useState(0)
  const [deliveryDate, setDeliveryDate] = useState('')

  function openEdit(id: string) {
    setEditing(suppliers.find((s) => s.id === id) ?? EMPTY)
    setDeliveryMaterialId('')
    setDeliveryQty(0)
    setDeliveryUnitPrice(0)
    setDeliveryDate('')
  }

  async function handleSave() {
    if (!editing?.name) return
    try {
      await upsert.mutateAsync(editing)
      setEditing(null)
    } catch (error) {
      alert(`Не удалось сохранить поставщика: ${getErrorMessage(error)}`)
    }
  }

  async function handleDelete() {
    if (!editing?.id) return
    if (!confirm('Удалить поставщика?')) return
    await del.mutateAsync(editing.id)
    setEditing(null)
  }

  async function handleAddDelivery() {
    if (!editing?.id || !deliveryMaterialId || deliveryQty <= 0) return
    try {
      await createDelivery.mutateAsync({
        supplier_id: editing.id,
        raw_material_id: deliveryMaterialId,
        qty: deliveryQty,
        unit_price: deliveryUnitPrice || undefined,
        delivery_date: deliveryDate || undefined,
      })
      setDeliveryMaterialId('')
      setDeliveryQty(0)
      setDeliveryUnitPrice(0)
      setDeliveryDate('')
    } catch (error) {
      alert(`Не удалось добавить поставку: ${getErrorMessage(error)}`)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-ink mb-6">Поставщики</h1>

      {isLoading ? (
        <div className="text-brand-gray-dark">Загрузка…</div>
      ) : (
        <CardListWithPhoto
          items={suppliers.map((s) => ({
            id: s.id,
            photo_url: s.photo_url,
            title: s.name,
            subtitle: s.supplies,
            meta: s.phone,
          }))}
          onItemClick={openEdit}
          onAdd={() => setEditing(EMPTY)}
          emptyLabel="Поставщиков пока нет"
          addLabel="Поставщик"
        />
      )}

      <EntityFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Редактировать поставщика' : 'Новый поставщик'}
        onDelete={editing?.id ? handleDelete : undefined}
        photoSlot={
          <PhotoUploader
            value={editing?.photo_url ?? null}
            folder="suppliers"
            onChange={(path) => setEditing((prev) => (prev ? { ...prev, photo_url: path } : prev))}
          />
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-gray-dark hover:bg-brand-gray transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={upsert.isPending || !editing?.name}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-yellow text-brand-black disabled:opacity-50 hover:brightness-95 transition"
            >
              Сохранить
            </button>
          </>
        }
      >
        {editing && (
          <>
            <FormField
              label="Имя"
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <FormField
              label="Телефон"
              value={editing.phone ?? ''}
              onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
            />
            <FormField
              label="Что поставляет"
              value={editing.supplies ?? ''}
              onChange={(e) => setEditing({ ...editing, supplies: e.target.value })}
            />
            <FormField
              label="Заметки"
              value={editing.notes ?? ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />

            {editing.id && (
              <>
                <div className="mt-2">
                  <div className="text-sm font-medium text-brand-ink mb-2">Новая поставка</div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                      value={deliveryMaterialId}
                      onChange={(e) => setDeliveryMaterialId(e.target.value)}
                      className="border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
                    >
                      <option value="">Материал…</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          #{m.code} {m.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
                    />
                    <input
                      type="number"
                      placeholder="Количество"
                      value={deliveryQty || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setDeliveryQty(Number(e.target.value))}
                      className="border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
                    />
                    <input
                      type="number"
                      placeholder="Цена за единицу"
                      value={deliveryUnitPrice || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setDeliveryUnitPrice(Number(e.target.value))}
                      className="border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDelivery}
                    disabled={!deliveryMaterialId || deliveryQty <= 0 || createDelivery.isPending}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-yellow text-brand-black disabled:opacity-50"
                  >
                    Добавить поставку
                  </button>
                </div>

                <div className="mt-2">
                  <div className="text-sm font-medium text-brand-ink mb-2">История поставок</div>
                  {deliveries.length === 0 ? (
                    <div className="text-xs text-brand-gray-dark">Поставок пока не было</div>
                  ) : (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                      {deliveries.map((d) => (
                        <div
                          key={d.id}
                          className="flex justify-between gap-2 text-xs bg-brand-gray rounded-lg px-3 py-2"
                        >
                          <span className="flex-1 min-w-0 truncate">
                            #{d.raw_material?.code} {d.raw_material?.name}
                          </span>
                          <span className="whitespace-nowrap">
                            {formatNumber(Number(d.qty))} {d.raw_material?.unit}
                          </span>
                          <span className="whitespace-nowrap">
                            {d.unit_price ? `${formatMoney(Number(d.unit_price))}/ед.` : '—'}
                          </span>
                          <span className="whitespace-nowrap font-semibold">
                            {d.total_cost ? formatMoney(Number(d.total_cost)) : '—'}
                          </span>
                          <span className="whitespace-nowrap">{formatDate(d.delivery_date)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </EntityFormModal>
    </div>
  )
}

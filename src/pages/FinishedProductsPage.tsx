import { useEffect, useState } from 'react'
import { BomEditor, type BomLine } from '../components/products/BomEditor'
import { CardListWithPhoto } from '../components/common/CardListWithPhoto'
import { EntityFormModal } from '../components/common/EntityFormModal'
import { FormField } from '../components/common/FormField'
import { PhotoUploader } from '../components/common/PhotoUploader'
import { formatMoney, formatNumber, getErrorMessage, nextProductCodePreview } from '../lib/formatters'
import {
  useDeleteProduct,
  useFinishedProducts,
  useProductBom,
  useUpsertProduct,
} from '../hooks/useFinishedProducts'
import { useRawMaterials, useUpsertRawMaterial } from '../hooks/useRawMaterials'
import type { FinishedProduct } from '../types/db'

const EMPTY: Partial<FinishedProduct> = { name: '', photo_url: null, sale_price: 0, stock_qty: 0 }

export function FinishedProductsPage() {
  const [search, setSearch] = useState('')
  const { data: products = [], isLoading } = useFinishedProducts(search)
  const { data: materials = [] } = useRawMaterials()
  const upsertMaterial = useUpsertRawMaterial()
  const upsert = useUpsertProduct()
  const del = useDeleteProduct()
  const [editing, setEditing] = useState<Partial<FinishedProduct> | null>(null)
  const [bom, setBom] = useState<BomLine[]>([])
  const { data: existingBom } = useProductBom(editing?.id)

  useEffect(() => {
    if (existingBom) {
      setBom(existingBom.map((row) => ({ raw_material_id: row.raw_material_id, qty_per_unit: Number(row.qty_per_unit) })))
    } else if (editing && !editing.id) {
      setBom([])
    }
  }, [existingBom, editing])

  function openEdit(id: string) {
    setEditing(products.find((p) => p.id === id) ?? EMPTY)
  }

  async function handleSave() {
    if (!editing?.name) return
    try {
      await upsert.mutateAsync({
        id: editing.id,
        product: {
          name: editing.name,
          photo_url: editing.photo_url ?? null,
          sale_price: Number(editing.sale_price ?? 0),
          stock_qty: Number(editing.stock_qty ?? 0),
        },
        bom: bom.filter((l) => l.raw_material_id && l.qty_per_unit > 0),
      })
      setEditing(null)
    } catch (error) {
      alert(`Не удалось сохранить продукт: ${getErrorMessage(error)}`)
    }
  }

  async function handleDelete() {
    if (!editing?.id) return
    if (!confirm('Удалить продукт?')) return
    await del.mutateAsync(editing.id)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-ink">Склад готовой продукции</h1>
        <input
          type="text"
          placeholder="Поиск по коду или названию…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-brand-border rounded-full px-4 py-2 text-sm w-64 outline-none focus:border-brand-yellow"
        />
      </div>

      {isLoading ? (
        <div className="text-brand-gray-dark">Загрузка…</div>
      ) : (
        <CardListWithPhoto
          items={products.map((p) => ({
            id: p.id,
            photo_url: p.photo_url,
            title: p.name,
            badge: `#${p.code}`,
            subtitle: formatMoney(Number(p.sale_price)),
            meta: `На складе: ${formatNumber(Number(p.stock_qty))} шт · себестоимость ${formatMoney(Number(p.cost_price))}`,
          }))}
          onItemClick={openEdit}
          onAdd={() => setEditing(EMPTY)}
          emptyLabel="Продуктов пока нет"
          addLabel="Продукт"
        />
      )}

      <EntityFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Продукт #${editing.code}` : 'Новый продукт'}
        onDelete={editing?.id ? handleDelete : undefined}
        photoSlot={
          <PhotoUploader
            value={editing?.photo_url ?? null}
            folder="products"
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
              label="Название"
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              suffix={
                !editing.id ? (
                  <span className="whitespace-nowrap text-xs font-semibold text-brand-yellow-dark bg-brand-yellow-light px-2 py-1 rounded-full">
                    код #{nextProductCodePreview(products)}
                  </span>
                ) : undefined
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Цена продажи"
                type="number"
                value={editing.sale_price ?? 0}
                onChange={(e) => setEditing({ ...editing, sale_price: Number(e.target.value) })}
              />
              <FormField
                label="Остаток на складе"
                type="number"
                value={editing.stock_qty ?? 0}
                onChange={(e) => setEditing({ ...editing, stock_qty: Number(e.target.value) })}
              />
            </div>
            {editing.id && (
              <div className="text-xs text-brand-gray-dark">
                Себестоимость считается автоматически из рецептуры: {formatMoney(Number(editing.cost_price ?? 0))}
              </div>
            )}
            <BomEditor
              lines={bom}
              onChange={setBom}
              materials={materials}
              onCreateMaterial={(input) => upsertMaterial.mutateAsync(input) as Promise<string>}
            />
          </>
        )}
      </EntityFormModal>
    </div>
  )
}

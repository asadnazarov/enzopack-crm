import { useState } from 'react'
import type { RawMaterial } from '../../types/db'

export interface BomLine {
  raw_material_id: string
  qty_per_unit: number
}

export interface NewMaterialInput {
  name: string
  unit: string
  unit_price: number
  stock_qty: number
}

interface BomEditorProps {
  lines: BomLine[]
  onChange: (lines: BomLine[]) => void
  materials: RawMaterial[]
  onCreateMaterial?: (input: NewMaterialInput) => Promise<string>
}

const EMPTY_NEW_MATERIAL: NewMaterialInput = { name: '', unit: 'шт', unit_price: 0, stock_qty: 0 }

export function BomEditor({ lines, onChange, materials, onCreateMaterial }: BomEditorProps) {
  const [creating, setCreating] = useState<NewMaterialInput | null>(null)
  const [saving, setSaving] = useState(false)

  function updateLine(index: number, patch: Partial<BomLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  function addLine() {
    onChange([...lines, { raw_material_id: materials[0]?.id ?? '', qty_per_unit: 1 }])
  }

  async function handleCreateMaterial() {
    if (!creating?.name || !onCreateMaterial) return
    setSaving(true)
    try {
      const id = await onCreateMaterial(creating)
      onChange([...lines, { raw_material_id: id, qty_per_unit: 1 }])
      setCreating(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-brand-ink">Сырьё на 1 единицу</span>
        <div className="flex items-center gap-3">
          {onCreateMaterial && (
            <button
              type="button"
              onClick={() => setCreating(EMPTY_NEW_MATERIAL)}
              className="text-xs font-semibold text-brand-yellow-dark hover:underline"
            >
              + новое сырьё
            </button>
          )}
          <button
            type="button"
            onClick={addLine}
            disabled={materials.length === 0}
            className="text-xs font-semibold text-brand-yellow-dark hover:underline disabled:opacity-40"
          >
            + добавить строку
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {lines.map((line, index) => {
          const material = materials.find((m) => m.id === line.raw_material_id)
          return (
            <div key={index} className="flex items-center gap-2">
              <select
                value={line.raw_material_id}
                onChange={(e) => updateLine(index, { raw_material_id: e.target.value })}
                className="flex-1 border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.code} {m.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="any"
                value={line.qty_per_unit}
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateLine(index, { qty_per_unit: Number(e.target.value) })}
                className="w-20 border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
              />
              <span className="w-10 text-xs text-brand-gray-dark">{material?.unit}</span>
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="text-brand-gray-dark hover:text-red-600 transition"
                aria-label="Удалить строку"
              >
                ✕
              </button>
            </div>
          )
        })}
        {lines.length === 0 && (
          <div className="text-xs text-brand-gray-dark">Сырьё для этого продукта ещё не указано</div>
        )}

        {creating && (
          <div className="flex flex-col gap-2 border border-brand-border rounded-lg p-3 mt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Название сырья"
                value={creating.name}
                onChange={(e) => setCreating({ ...creating, name: e.target.value })}
                className="flex-1 border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
              />
              <input
                type="text"
                placeholder="Ед. изм."
                value={creating.unit}
                onChange={(e) => setCreating({ ...creating, unit: e.target.value })}
                className="w-24 border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Остаток"
                value={creating.stock_qty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCreating({ ...creating, stock_qty: Number(e.target.value) })}
                className="flex-1 border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
              />
              <input
                type="number"
                placeholder="Цена за единицу"
                value={creating.unit_price}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCreating({ ...creating, unit_price: Number(e.target.value) })}
                className="flex-1 border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(null)}
                className="text-xs text-brand-gray-dark hover:underline"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateMaterial}
                disabled={!creating.name || saving}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-yellow text-brand-black disabled:opacity-50"
              >
                Создать и добавить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

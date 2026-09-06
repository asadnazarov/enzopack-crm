import type { RawMaterial } from '../../types/db'

export interface BomLine {
  raw_material_id: string
  qty_per_unit: number
}

interface BomEditorProps {
  lines: BomLine[]
  onChange: (lines: BomLine[]) => void
  materials: RawMaterial[]
}

export function BomEditor({ lines, onChange, materials }: BomEditorProps) {
  function updateLine(index: number, patch: Partial<BomLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index))
  }

  function addLine() {
    onChange([...lines, { raw_material_id: materials[0]?.id ?? '', qty_per_unit: 1 }])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-brand-ink">Сырьё на 1 единицу</span>
        <button
          type="button"
          onClick={addLine}
          className="text-xs font-semibold text-brand-yellow-dark hover:underline"
        >
          + добавить строку
        </button>
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
      </div>
    </div>
  )
}

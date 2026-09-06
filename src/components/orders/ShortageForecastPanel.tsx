import type { BomLine } from '../products/BomEditor'
import type { RawMaterial } from '../../types/db'

interface ShortageForecastPanelProps {
  bom: BomLine[]
  quantity: number
  materials: RawMaterial[]
}

export function ShortageForecastPanel({ bom, quantity, materials }: ShortageForecastPanelProps) {
  const rows = bom
    .filter((line) => line.raw_material_id && line.qty_per_unit > 0)
    .map((line) => {
      const material = materials.find((m) => m.id === line.raw_material_id)
      const currentStock = Number(material?.stock_qty ?? 0)
      const needed = line.qty_per_unit * quantity
      const after = currentStock - needed
      return { material, needed, currentStock, after }
    })
    .filter((row) => row.material)

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-brand-border bg-brand-gray p-3">
      <div className="text-sm font-medium text-brand-ink mb-2">Влияние на склад сырья</div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.material!.id} className="flex items-center justify-between text-xs">
            <span className="text-brand-ink">
              #{row.material!.code} {row.material!.name}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-brand-gray-dark">
                {row.currentStock} {row.material!.unit}
              </span>
              <span className="text-brand-gray-dark">→</span>
              <span
                className={`font-semibold ${row.after < 0 ? 'text-red-600' : 'text-green-700'}`}
              >
                {row.after} {row.material!.unit}
              </span>
              {row.after < 0 && <span className="text-red-600 font-semibold">не хватает!</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

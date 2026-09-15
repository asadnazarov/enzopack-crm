import type { QuoteResult } from '../../lib/calculator'
import type { RawMaterial } from '../../types/db'
import { formatNumber } from '../../lib/formatters'

interface CalculatorMaterialHintPanelProps {
  result: QuoteResult | null
  materialIds: (string | undefined)[]
  glueMaterialIds: { starch?: string; liquid?: string }
  materials: RawMaterial[]
}

// Advisory-only comparison against current warehouse stock. Nothing here is
// ever written to the database — actual stock is only deducted when an
// order moves into production (see update_order_status in 0010).
export function CalculatorMaterialHintPanel({
  result,
  materialIds,
  glueMaterialIds,
  materials,
}: CalculatorMaterialHintPanelProps) {
  if (!result) return null

  const rows = [
    ...result.materialDetails.map((m, index) => ({
      label: m.name,
      needed: m.kg,
      materialId: materialIds[index],
    })),
    ...result.glueDetails
      .filter((g) => g.type === 'starch' || g.type === 'liquid')
      .map((g) => ({
        label: g.name,
        needed: g.kg,
        materialId: g.type === 'liquid' ? glueMaterialIds.liquid : glueMaterialIds.starch,
      })),
  ]
    .filter((row) => row.materialId && row.needed > 0)
    .map((row) => {
      const material = materials.find((m) => m.id === row.materialId)
      const currentStock = Number(material?.stock_qty ?? 0)
      const after = currentStock - row.needed
      return { ...row, material, currentStock, after }
    })
    .filter((row) => row.material)

  if (rows.length === 0) return null

  const shortages = rows.filter((row) => row.after < 0)

  return (
    <div className="rounded-xl border border-brand-border bg-brand-gray p-3">
      <div className="text-sm font-medium text-brand-ink mb-2">
        Подсказка по складу{' '}
        <span className="text-xs font-normal text-brand-gray-dark">— ничего пока не списывается</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.material!.id + row.label} className="flex items-center justify-between text-xs gap-2">
            <span className="text-brand-ink truncate">
              #{row.material!.code} {row.material!.name}
              {row.label !== row.material!.name && <span className="text-brand-gray-dark"> · {row.label}</span>}
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-brand-gray-dark">
                есть {formatNumber(row.currentStock)} {row.material!.unit}
              </span>
              <span className="text-brand-gray-dark">·</span>
              <span className="text-brand-gray-dark">
                нужно {formatNumber(row.needed)} {row.material!.unit}
              </span>
              {row.after < 0 ? (
                <span className="font-semibold text-red-600">
                  не хватает {formatNumber(-row.after)} {row.material!.unit}
                </span>
              ) : (
                <span className="font-semibold text-green-700">хватает</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {shortages.length > 0 && (
        <div className="mt-2 text-xs text-red-600">
          Нужно закупить: {shortages.map((row) => `${row.material!.name} — ${formatNumber(-row.after)} ${row.material!.unit}`).join('; ')}
        </div>
      )}
    </div>
  )
}

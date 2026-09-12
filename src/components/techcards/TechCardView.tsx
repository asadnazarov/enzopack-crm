import type { ReactNode } from 'react'
import { formatDate, formatMoney, formatNumber } from '../../lib/formatters'
import type { QuoteResult } from '../../lib/calculator'
import type { TechCard } from '../../types/db'

interface TechCardViewProps {
  techCard: TechCard
  mode: 'management' | 'client'
}

export function TechCardView({ techCard, mode }: TechCardViewProps) {
  const result = techCard.result_snapshot as unknown as QuoteResult

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between text-xs text-brand-gray-dark">
        <span>Расчёт от {formatDate(techCard.created_at)}</span>
        {techCard.die && (
          <span className="bg-brand-gray px-2 py-0.5 rounded-full">
            Нож: #{techCard.die.code} {techCard.die.name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Info label="Формат" value={`${formatNumber(result.blank.w)} × ${formatNumber(result.blank.h)} мм`} />
        <Info label="Площадь коробки" value={`${result.areaPerBox.toFixed(3)} м²`} />
        <Info label="Тираж" value={`${formatNumber(result.quantity)} шт.`} />
        <Info label="Слоёв картона" value={`${result.materialDetails.length}`} />
      </div>

      {mode === 'management' && (
        <>
          <Section title="Материалы">
            {result.materialDetails.map((m) => (
              <Row key={m.index} label={m.name} value={`${m.kg.toFixed(2)} кг · ${formatMoney(m.cost)}`} />
            ))}
          </Section>

          {result.glueDetails.length > 0 && (
            <Section title="Клей">
              {result.glueDetails.map((g, i) => (
                <Row key={i} label={g.name} value={`${g.kg.toFixed(2)} кг · ${formatMoney(g.cost)}`} />
              ))}
            </Section>
          )}

          <Section title="Маршрут">
            {result.operationDetails
              .filter((op) => op.active)
              .map((op) => (
                <Row key={op.id} label={op.name} value={formatMoney(op.total)} />
              ))}
          </Section>

          <Section title="Итог">
            <Row label="Материалы" value={formatMoney(result.materialOrderCost)} />
            <Row label="Клей" value={formatMoney(result.glueOrderCost)} />
            <Row label="Печать" value={formatMoney(result.printOrderCost)} />
            <Row label="Производство" value={formatMoney(result.productionOrderCost)} />
            <Row label="Накладные" value={formatMoney(result.overheadOrderCost)} />
            <Row label="Логистика" value={formatMoney(result.logisticsOrderCost)} />
            <Row label="Себестоимость 1 шт." value={formatMoney(result.unitCost)} bold />
            <Row label="Прибыль 1 шт." value={formatMoney(result.unitProfit)} bold />
            <Row label="Маржа" value={`${result.actualMargin.toFixed(2)}%`} bold />
          </Section>
        </>
      )}

      <div className="bg-brand-gray rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-brand-gray-dark">Цена с НДС за коробку</span>
        <span className="text-lg font-extrabold text-brand-ink">{formatMoney(result.saleVat)}</span>
      </div>
      <div className="text-xs text-brand-gray-dark text-right">
        Итого заказ с НДС: <strong className="text-brand-ink">{formatMoney(result.totalVat)}</strong>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-gray rounded-lg px-3 py-2">
      <div className="text-[10px] text-brand-gray-dark uppercase">{label}</div>
      <div className="text-sm font-medium text-brand-ink">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-brand-ink mb-1">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-brand-gray-dark">{label}</span>
      <span className={bold ? 'font-semibold text-brand-ink' : 'text-brand-ink'}>{value}</span>
    </div>
  )
}

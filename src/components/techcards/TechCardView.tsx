import type { ReactNode } from 'react'
import { formatDate, formatMoney, formatNumber } from '../../lib/formatters'
import type { CalculatorConfig, QuoteResult } from '../../lib/calculator'
import type { TechCard } from '../../types/db'

interface TechCardViewProps {
  techCard: TechCard
  mode: 'management' | 'client'
}

const BOARD_TYPE_LABELS: Record<string, string> = {
  '3': '3-слойный гофрокартон',
  '5': '5-слойный гофрокартон',
  ready: 'Покупной картон',
}

const PRINT_TYPE_LABELS: Record<string, string> = {
  none: 'Без печати',
  flexo: 'Флексопечать',
  offset: 'Офсетная печать',
  service: 'Услуга печати',
}

const GLUE_LINE_LABELS: Record<string, string> = {
  starch: 'крахмальный',
  liquid: 'жидкое стекло',
  none: 'не считался',
}

export function TechCardView({ techCard, mode }: TechCardViewProps) {
  const result = techCard.result_snapshot as unknown as QuoteResult
  const input = techCard.input_snapshot as unknown as CalculatorConfig | undefined
  const glueLineSummary = input?.glueLines
    ?.filter((line) => line.type !== 'none')
    .map((line, index) => `${line.name ?? `слой ${index + 1}`}: ${GLUE_LINE_LABELS[line.type]}`)
    .join(', ')

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
        <Info label="Расчёт формата" value={result.basis === 'box' ? 'По коробке' : 'По листу'} />
        <Info label="Формат" value={`${formatNumber(result.blank.w)} × ${formatNumber(result.blank.h)} мм`} />
        <Info label="Площадь коробки" value={`${result.areaPerBox.toFixed(3)} м²`} />
        <Info label="Тираж" value={`${formatNumber(result.quantity)} шт.`} />
        <Info label="Картон" value={input ? (BOARD_TYPE_LABELS[input.boardType] ?? input.boardType) : `${result.materialDetails.length} слоёв`} />
        <Info label="Отход материала" value={input ? `${input.waste}%` : '—'} />
        <Info label="Печать" value={input ? `${PRINT_TYPE_LABELS[input.printType]}${input.printType !== 'none' ? `, ${input.colors} цв.` : ''}` : '—'} />
        <Info label="Межслойный клей" value={glueLineSummary || 'не использовался'} />
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

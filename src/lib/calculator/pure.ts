// Literal TS port of the calculation engine from ENZOPACK_CALCULATOR_FINAL.html
// (function-for-function, same math). The only behavioral difference from the
// original: `config.layers[]` here already carries resolved {name, grammage,
// price, factor} — the CRM resolves those from `raw_materials` (via the
// `grammage` column) before calling calculateQuote, instead of the original's
// separate `settings.materials[]` catalog. The calculateQuote contract itself
// is unchanged.

import type {
  Blank,
  CalculatorConfig,
  GlueDetail,
  GlueSettings,
  MaterialDetail,
  OffsetTier,
  OperationDetail,
  OperationSetting,
  OverheadDetail,
  ProductionSettings,
  QuoteResult,
  TariffSettings,
} from './types'

export function number(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function positive(value: unknown, fallback = 0): number {
  return Math.max(0, number(value, fallback))
}

export function clamp(value: unknown, min: number, max: number): number {
  return Math.min(max, Math.max(min, number(value)))
}

export function round(value: unknown, digits = 2): number {
  const power = 10 ** digits
  return Math.round((number(value) + Number.EPSILON) * power) / power
}

export function roundUp(value: unknown, step = 0.01): number {
  const safeStep = positive(step, 0.01) || 0.01
  return Math.ceil((number(value) - 1e-9) / safeStep) * safeStep
}

export function getBlank(config: Pick<CalculatorConfig, 'length' | 'width' | 'height' | 'glueFlap' | 'construction'>): Blank {
  const length = positive(config.length)
  const width = positive(config.width)
  const height = positive(config.height)
  const flap = positive(config.glueFlap)
  if (config.construction === 'tray') return { w: length + 2 * height, h: width + 2 * height }
  return { w: 2 * (length + width) + flap, h: height + width }
}

export function getStarchPrice(glue: GlueSettings): number {
  const recipe = Array.isArray(glue?.recipe) ? glue.recipe : []
  const totals = recipe.reduce(
    (sum, item) => ({ kg: sum.kg + positive(item.kg), cost: sum.cost + positive(item.cost) }),
    { kg: 0, cost: 0 },
  )
  return totals.kg > 0 ? totals.cost / totals.kg : 0
}

export function equipmentHourlyCost(operation: OperationSetting, tariffs: TariffSettings): number {
  const asset = positive(operation.assetUsd) * positive(tariffs.usd)
  const years = positive(tariffs.amortYears, 1) || 1
  const days = positive(tariffs.workDays, 1) || 1
  const hours = positive(tariffs.workHours, 1) || 1
  const repairRate = clamp(tariffs.repairRate, 0, 100) / 100
  return asset / (years * days * hours) + (asset * repairRate) / (days * hours)
}

export function resolveOffsetRate(sheetRun: number, manualRate: number, tiers: OffsetTier[]): number {
  if (positive(manualRate) > 0) return positive(manualRate)
  const list = Array.isArray(tiers) ? tiers : []
  const match = list.find((tier) => sheetRun >= positive(tier.from) && sheetRun <= positive(tier.to))
  return match ? positive(match.price) : 0
}

export function calculateQuote(config: CalculatorConfig, settings: ProductionSettings): QuoteResult {
  const quantity = Math.max(1, Math.round(number(config.quantity, 1)))
  const basis = config.basis === 'box' ? 'box' : 'sheet'
  const blank: Blank =
    basis === 'box' ? getBlank(config) : { w: positive(config.sheetWidth), h: positive(config.sheetHeight) }
  const boxesPerSheet = basis === 'box' ? 1 : Math.max(1, Math.round(number(config.boxesPerSheet, 1)))
  const sheetRun = Math.ceil(quantity / boxesPerSheet)
  const calculatedOutput = sheetRun * boxesPerSheet
  const roundingReserve = calculatedOutput - quantity
  const sheetArea = (blank.w * blank.h) / 1_000_000
  const totalArea = sheetArea * sheetRun
  const materialArea = totalArea * (1 + clamp(config.waste, 0, 100) / 100)
  const areaPerBox = sheetArea / boxesPerSheet
  const boxesPerSquareMeter = areaPerBox > 0 ? 1 / areaPerBox : 0
  const boxesPer100SquareMeters = boxesPerSquareMeter * 100
  const orderNetArea = areaPerBox * quantity

  const layers = Array.isArray(config.layers) ? config.layers : []
  const materialDetails: MaterialDetail[] = layers.map((layer, index) => {
    const grammage = positive(layer.grammage)
    const price = positive(layer.price)
    const factor = Math.max(1, number(layer.factor, 1))
    const kg = (materialArea * grammage * factor) / 1000
    const cost = kg * price
    return { index, name: layer.name || `Слой ${index + 1}`, grammage, price, factor, kg, cost }
  })
  const paperWeight = materialDetails.reduce((sum, item) => sum + item.kg, 0)
  const materialOrderCost = materialDetails.reduce((sum, item) => sum + item.cost, 0)

  const starchPrice = getStarchPrice(settings.glue)
  const interlayerLines = Array.isArray(config.glueLines) ? config.glueLines : []
  const glueDetails: GlueDetail[] = interlayerLines
    .map((line, lineIndex) => ({ ...line, lineIndex }))
    .filter((line) => line.enabled && line.type !== 'none')
    .map((line, index) => {
      const isLiquid = line.type === 'liquid'
      const norm = isLiquid ? positive(settings.glue.liquidNorm) : positive(settings.glue.starchNorm)
      const price = isLiquid ? positive(settings.glue.liquidPrice) : starchPrice
      const kg = (materialArea * norm) / 1000
      return {
        name: line.name || `Линия ${index + 1}`,
        lineIndex: line.lineIndex,
        type: line.type,
        norm,
        price,
        kg,
        cost: kg * price,
      }
    })

  const tariffs = settings.tariffs
  const operationSettings = Array.isArray(settings.operations) ? settings.operations : []
  const activeOperations = config.activeOperations || {}
  const operationDetails: OperationDetail[] = operationSettings.map((operation) => {
    let active = Boolean(activeOperations[operation.id])
    if (operation.id === 'corrugator' && config.boardType === 'ready') active = false
    if (operation.id === 'flexo') active = config.printType === 'flexo'
    const count = operation.basis === 'sheets' ? sheetRun : calculatedOutput
    const productivity = positive(operation.productivity)
    const time = active && productivity > 0 ? positive(operation.prepMin) / 60 + count / productivity : 0
    const laborHours = time * positive(operation.workers)
    const laborCost = time * positive(operation.teamLaborHour)
    const energyQty = time * positive(operation.kw)
    const energyCost = energyQty * positive(tariffs.electricity)
    const gasQty = time * positive(operation.gasM3h)
    const gasCost = gasQty * positive(tariffs.gas)
    const equipmentHour = equipmentHourlyCost(operation, tariffs)
    const equipmentCost = time * equipmentHour
    return {
      ...operation,
      active,
      count,
      time,
      laborHours,
      laborCost,
      energyQty,
      energyCost,
      gasQty,
      gasCost,
      equipmentHour,
      equipmentCost,
      total: laborCost + energyCost + gasCost + equipmentCost,
    }
  })

  const operationById = Object.fromEntries(operationDetails.map((item) => [item.id, item]))
  if (operationById.lamination?.active) {
    const norm = positive(settings.glue.laminationNorm)
    const kg = (totalArea * norm) / 1000
    glueDetails.push({ name: 'Автомат-кашировка', type: 'starch', norm, price: starchPrice, kg, cost: kg * starchPrice })
  }
  if (operationById.auto_glue?.active) {
    const norm = positive(settings.glue.autoNorm)
    const kg = (calculatedOutput * norm) / 1000
    glueDetails.push({ name: 'Автомат-склейка', type: 'starch', norm, price: starchPrice, kg, cost: kg * starchPrice })
  }
  if (operationById.manual_glue?.active) {
    const norm = positive(settings.glue.manualNorm)
    const kg = (calculatedOutput * norm) / 1000
    glueDetails.push({ name: 'Ручная склейка', type: 'starch', norm, price: starchPrice, kg, cost: kg * starchPrice })
  }
  const glueWeight = glueDetails.reduce((sum, item) => sum + item.kg, 0)
  const glueOrderCost = glueDetails.reduce((sum, item) => sum + item.cost, 0)

  const flexoCost = operationById.flexo?.active ? operationById.flexo.total : 0
  let printRate = 0
  let printOrderCost = 0
  if (config.printType === 'flexo') {
    printOrderCost = flexoCost
    printRate = calculatedOutput > 0 ? flexoCost / calculatedOutput : 0
  } else if (config.printType === 'offset') {
    printRate = resolveOffsetRate(sheetRun, config.printRate, settings.offsetTiers)
    printOrderCost = sheetRun * printRate
  } else if (config.printType === 'service') {
    printRate = positive(config.printRate)
    printOrderCost = quantity * printRate
  }
  if (config.printType !== 'none') printOrderCost += positive(config.plateFee)

  const productionOperations = operationDetails.filter((item) => item.active && item.id !== 'flexo')
  const productionOrderCost = productionOperations.reduce((sum, item) => sum + item.total, 0)
  const routeOrderCost = productionOrderCost + flexoCost
  const routeTime = operationDetails.reduce((sum, item) => sum + item.time, 0)
  const laborHours = operationDetails.reduce((sum, item) => sum + item.laborHours, 0)
  const energyQty = operationDetails.reduce((sum, item) => sum + item.energyQty, 0)
  const gasQty = operationDetails.reduce((sum, item) => sum + item.gasQty, 0)

  const plannedArea = positive(settings.overhead?.plannedArea, 1) || 1
  const overheadDetails: OverheadDetail[] = (settings.overhead?.items || []).map((item) => {
    const monthly = positive(item.monthly)
    const norm = monthly / plannedArea
    return { ...item, monthly, norm, cost: totalArea * norm }
  })
  const overheadOrderCost = overheadDetails.reduce((sum, item) => sum + item.cost, 0)
  const logisticsOrderCost = positive(config.logistics) + positive(config.deliveryCost)

  const totalCost =
    materialOrderCost + glueOrderCost + printOrderCost + productionOrderCost + overheadOrderCost + logisticsOrderCost
  const unitCost = totalCost / quantity
  const vatRate = clamp(config.vat, 0, 100) / 100
  let saleNoVat: number
  let vatPerUnit: number
  let saleVat: number

  if (config.pricingMode === 'manual') {
    saleVat = positive(config.manualPrice)
    saleNoVat = vatRate > 0 ? saleVat / (1 + vatRate) : saleVat
    vatPerUnit = saleVat - saleNoVat
  } else {
    const targetMargin = clamp(config.margin, 0, 90) / 100
    const rawNoVat = unitCost / (1 - targetMargin)
    const step = positive(config.rounding, 0.01) || 0.01
    if (step <= 0.01) {
      saleNoVat = round(rawNoVat, 2)
      vatPerUnit = round(saleNoVat * vatRate, 2)
      saleVat = round(saleNoVat + vatPerUnit, 2)
    } else {
      saleVat = roundUp(rawNoVat * (1 + vatRate), step)
      saleNoVat = vatRate > 0 ? saleVat / (1 + vatRate) : saleVat
      vatPerUnit = saleVat - saleNoVat
    }
  }

  const unitProfit = saleNoVat - unitCost
  const totalNoVat = saleNoVat * quantity
  const totalVat = saleVat * quantity
  const vatAmount = vatPerUnit * quantity
  const totalProfit = unitProfit * quantity
  const actualMargin = saleNoVat > 0 ? (unitProfit / saleNoVat) * 100 : 0

  return {
    quantity,
    basis,
    blank,
    boxesPerSheet,
    sheetRun,
    calculatedOutput,
    roundingReserve,
    sheetArea,
    totalArea,
    materialArea,
    areaPerBox,
    boxesPerSquareMeter,
    boxesPer100SquareMeters,
    orderNetArea,
    materialDetails,
    paperWeight,
    materialOrderCost,
    starchPrice,
    glueDetails,
    glueWeight,
    glueOrderCost,
    operationDetails,
    routeOrderCost,
    productionOrderCost,
    routeTime,
    laborHours,
    energyQty,
    gasQty,
    printRate,
    printOrderCost,
    overheadDetails,
    overheadOrderCost,
    logisticsOrderCost,
    totalCost,
    unitCost,
    saleNoVat,
    vatPerUnit,
    saleVat,
    unitProfit,
    totalNoVat,
    totalVat,
    vatAmount,
    totalProfit,
    actualMargin,
  }
}

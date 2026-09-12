export type CalculatorBasis = 'sheet' | 'box'
export type BoxConstruction = '0201' | 'tray'
export type BoardType = 'produce' | 'ready'
export type GlueLineType = 'starch' | 'liquid' | 'none'
export type PrintType = 'none' | 'flexo' | 'offset' | 'service'
export type PricingMode = 'margin' | 'manual'

export interface ResolvedLayer {
  name: string
  grammage: number
  price: number
  factor: number
}

export interface GlueLineConfig {
  type: GlueLineType
  enabled: boolean
  name?: string
  lineIndex?: number
}

export interface CalculatorConfig {
  basis: CalculatorBasis
  sheetWidth: number
  sheetHeight: number
  boxesPerSheet: number
  length: number
  width: number
  height: number
  construction: BoxConstruction
  glueFlap: number
  quantity: number
  waste: number
  boardType: BoardType
  layers: ResolvedLayer[]
  glueLines: GlueLineConfig[]
  activeOperations: Record<string, boolean>
  printType: PrintType
  colors: number
  printRate: number
  plateFee: number
  pricingMode: PricingMode
  margin: number
  manualPrice: number
  vat: number
  rounding: number
  logistics: number
  deliveryCost: number
}

export interface GlueRecipeItem {
  id: string
  name: string
  kg: number
  cost: number
}

export interface GlueSettings {
  recipe: GlueRecipeItem[]
  starchNorm: number
  liquidPrice: number
  liquidNorm: number
  laminationNorm: number
  autoNorm: number
  manualNorm: number
}

export interface TariffSettings {
  electricity: number
  gas: number
  usd: number
  amortYears: number
  repairRate: number
  workDays: number
  workHours: number
}

export interface OperationSetting {
  id: string
  name: string
  basis: 'sheets' | 'boxes'
  productivity: number
  prepMin: number
  workers: number
  teamLaborHour: number
  kw: number
  gasM3h: number
  assetUsd: number
  staff?: string
}

export interface OverheadItem {
  id: string
  name: string
  monthly: number
}

export interface OverheadSettings {
  plannedArea: number
  items: OverheadItem[]
}

export interface OffsetTier {
  from: number
  to: number
  price: number
}

export interface ProductionSettings {
  version: number
  glue: GlueSettings
  tariffs: TariffSettings
  operations: OperationSetting[]
  overhead: OverheadSettings
  offsetTiers: OffsetTier[]
}

export interface Blank {
  w: number
  h: number
}

export interface MaterialDetail {
  index: number
  name: string
  grammage: number
  price: number
  factor: number
  kg: number
  cost: number
}

export interface GlueDetail {
  name: string
  lineIndex?: number
  type: GlueLineType
  norm: number
  price: number
  kg: number
  cost: number
}

export interface OperationDetail extends OperationSetting {
  active: boolean
  count: number
  time: number
  laborHours: number
  laborCost: number
  energyQty: number
  energyCost: number
  gasQty: number
  gasCost: number
  equipmentHour: number
  equipmentCost: number
  total: number
}

export interface OverheadDetail extends OverheadItem {
  monthly: number
  norm: number
  cost: number
}

export interface QuoteResult {
  quantity: number
  basis: CalculatorBasis
  blank: Blank
  boxesPerSheet: number
  sheetRun: number
  calculatedOutput: number
  roundingReserve: number
  sheetArea: number
  totalArea: number
  materialArea: number
  areaPerBox: number
  boxesPerSquareMeter: number
  boxesPer100SquareMeters: number
  orderNetArea: number
  materialDetails: MaterialDetail[]
  paperWeight: number
  materialOrderCost: number
  starchPrice: number
  glueDetails: GlueDetail[]
  glueWeight: number
  glueOrderCost: number
  operationDetails: OperationDetail[]
  routeOrderCost: number
  productionOrderCost: number
  routeTime: number
  laborHours: number
  energyQty: number
  gasQty: number
  printRate: number
  printOrderCost: number
  overheadDetails: OverheadDetail[]
  overheadOrderCost: number
  logisticsOrderCost: number
  totalCost: number
  unitCost: number
  saleNoVat: number
  vatPerUnit: number
  saleVat: number
  unitProfit: number
  totalNoVat: number
  totalVat: number
  vatAmount: number
  totalProfit: number
  actualMargin: number
}

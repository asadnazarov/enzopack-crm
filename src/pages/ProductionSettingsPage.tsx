import { useEffect, useState } from 'react'
import { getErrorMessage } from '../lib/formatters'
import { getStarchPrice } from '../lib/calculator'
import type { ProductionSettings } from '../lib/calculator'
import { useProductionSettings, useUpdateProductionSettings } from '../hooks/useProductionSettings'

const TABS = [
  { key: 'glue', label: 'Клей' },
  { key: 'equipment', label: 'Оборудование' },
  { key: 'expenses', label: 'Тарифы и расходы' },
  { key: 'offset', label: 'Офсетная печать' },
] as const

function inputClass() {
  return 'border border-brand-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-brand-yellow w-full'
}

export function ProductionSettingsPage() {
  const { data, isLoading } = useProductionSettings()
  const update = useUpdateProductionSettings()
  const [settings, setSettings] = useState<ProductionSettings | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('glue')

  useEffect(() => {
    if (data && !settings) setSettings(data)
  }, [data, settings])

  async function handleSave() {
    if (!settings) return
    try {
      await update.mutateAsync(settings)
      alert('Настройки сохранены')
    } catch (error) {
      alert(`Не удалось сохранить настройки: ${getErrorMessage(error)}`)
    }
  }

  if (isLoading || !settings) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-brand-ink mb-6">Настройки производства</h1>
        <div className="text-brand-gray-dark">Загрузка…</div>
      </div>
    )
  }

  const starchPrice = getStarchPrice(settings.glue)

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-brand-ink">Настройки производства</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={update.isPending}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-yellow text-brand-black disabled:opacity-50 hover:brightness-95 transition"
        >
          Сохранить
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key ? 'bg-brand-yellow text-brand-black' : 'bg-white border border-brand-border text-brand-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'glue' && (
        <div className="bg-white border border-brand-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-brand-ink">Рецепт крахмального клея</div>
            <span className="text-xs font-semibold bg-brand-yellow-light text-brand-yellow-dark px-2 py-1 rounded-full">
              {starchPrice.toFixed(2)} сум/кг
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {settings.glue.recipe.map((item, index) => (
              <div key={item.id} className="grid grid-cols-3 gap-2">
                <input
                  className={inputClass()}
                  value={item.name}
                  onChange={(e) => {
                    const recipe = [...settings.glue.recipe]
                    recipe[index] = { ...item, name: e.target.value }
                    setSettings({ ...settings, glue: { ...settings.glue, recipe } })
                  }}
                />
                <input
                  type="number"
                  className={inputClass()}
                  value={item.kg}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const recipe = [...settings.glue.recipe]
                    recipe[index] = { ...item, kg: Number(e.target.value) }
                    setSettings({ ...settings, glue: { ...settings.glue, recipe } })
                  }}
                />
                <input
                  type="number"
                  className={inputClass()}
                  value={item.cost}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const recipe = [...settings.glue.recipe]
                    recipe[index] = { ...item, cost: Number(e.target.value) }
                    setSettings({ ...settings, glue: { ...settings.glue, recipe } })
                  }}
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-brand-gray-dark">Название / кг на замес / стоимость на замес</div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-brand-gray-dark">Крахмальный клей, г/м²</span>
              <input
                type="number"
                className={inputClass()}
                value={settings.glue.starchNorm}
                onChange={(e) => setSettings({ ...settings, glue: { ...settings.glue, starchNorm: Number(e.target.value) } })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-brand-gray-dark">Жидкое стекло, сум/кг</span>
              <input
                type="number"
                className={inputClass()}
                value={settings.glue.liquidPrice}
                onChange={(e) => setSettings({ ...settings, glue: { ...settings.glue, liquidPrice: Number(e.target.value) } })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-brand-gray-dark">Жидкое стекло, г/м²</span>
              <input
                type="number"
                className={inputClass()}
                value={settings.glue.liquidNorm}
                onChange={(e) => setSettings({ ...settings, glue: { ...settings.glue, liquidNorm: Number(e.target.value) } })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-brand-gray-dark">Кашировка, г/м²</span>
              <input
                type="number"
                className={inputClass()}
                value={settings.glue.laminationNorm}
                onChange={(e) => setSettings({ ...settings, glue: { ...settings.glue, laminationNorm: Number(e.target.value) } })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-brand-gray-dark">Автосклейка, г/короб.</span>
              <input
                type="number"
                className={inputClass()}
                value={settings.glue.autoNorm}
                onChange={(e) => setSettings({ ...settings, glue: { ...settings.glue, autoNorm: Number(e.target.value) } })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-brand-gray-dark">Ручная склейка, г/короб.</span>
              <input
                type="number"
                className={inputClass()}
                value={settings.glue.manualNorm}
                onChange={(e) => setSettings({ ...settings, glue: { ...settings.glue, manualNorm: Number(e.target.value) } })}
              />
            </label>
          </div>
          <div className="text-xs text-brand-gray-dark">
            Каталог бумаги/картона теперь редактируется в разделе «Склад сырья» (поле «Граммаж»).
          </div>
        </div>
      )}

      {tab === 'equipment' && (
        <div className="bg-white border border-brand-border rounded-2xl p-5 overflow-x-auto">
          <table className="min-w-[900px] w-full text-xs">
            <thead>
              <tr className="text-brand-gray-dark uppercase text-[10px]">
                <th className="text-left p-2">Операция</th>
                <th className="text-left p-2">База</th>
                <th className="text-left p-2">Шт/ч</th>
                <th className="text-left p-2">Подг., мин</th>
                <th className="text-left p-2">Рабочих</th>
                <th className="text-left p-2">Труд/ч</th>
                <th className="text-left p-2">кВт</th>
                <th className="text-left p-2">Газ/ч</th>
                <th className="text-left p-2">Цена, $</th>
              </tr>
            </thead>
            <tbody>
              {settings.operations.map((op, index) => (
                <tr key={op.id} className="border-t border-brand-border">
                  <td className="p-2 font-semibold text-brand-ink whitespace-nowrap">{op.name}</td>
                  <td className="p-2">
                    <select
                      className={inputClass()}
                      value={op.basis}
                      onChange={(e) => {
                        const operations = [...settings.operations]
                        operations[index] = { ...op, basis: e.target.value as 'sheets' | 'boxes' }
                        setSettings({ ...settings, operations })
                      }}
                    >
                      <option value="sheets">Листы</option>
                      <option value="boxes">Коробки</option>
                    </select>
                  </td>
                  {(['productivity', 'prepMin', 'workers', 'teamLaborHour', 'kw', 'gasM3h', 'assetUsd'] as const).map(
                    (field) => (
                      <td key={field} className="p-2">
                        <input
                          type="number"
                          className={inputClass()}
                          value={op[field]}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const operations = [...settings.operations]
                            operations[index] = { ...op, [field]: Number(e.target.value) }
                            setSettings({ ...settings, operations })
                          }}
                        />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-brand-border rounded-2xl p-5">
            <div className="text-sm font-medium text-brand-ink mb-3">Тарифы</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(
                [
                  ['electricity', 'Электроэнергия, сум/кВт·ч'],
                  ['gas', 'Газ, сум/м³'],
                  ['usd', 'Курс USD/UZS'],
                  ['amortYears', 'Амортизация, лет'],
                  ['repairRate', 'Ремонт/ТО, %/год'],
                  ['workDays', 'Раб. дней в году'],
                  ['workHours', 'Раб. часов в день'],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-brand-gray-dark">{label}</span>
                  <input
                    type="number"
                    className={inputClass()}
                    value={settings.tariffs[field]}
                    onChange={(e) =>
                      setSettings({ ...settings, tariffs: { ...settings.tariffs, [field]: Number(e.target.value) } })
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-brand-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-brand-ink">Накладные расходы</div>
              <label className="flex items-center gap-2 text-xs text-brand-gray-dark">
                Плановый выпуск, м²/мес
                <input
                  type="number"
                  className={`${inputClass()} w-32`}
                  value={settings.overhead.plannedArea}
                  onChange={(e) =>
                    setSettings({ ...settings, overhead: { ...settings.overhead, plannedArea: Number(e.target.value) } })
                  }
                />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              {settings.overhead.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-2 gap-2">
                  <input
                    className={inputClass()}
                    value={item.name}
                    onChange={(e) => {
                      const items = [...settings.overhead.items]
                      items[index] = { ...item, name: e.target.value }
                      setSettings({ ...settings, overhead: { ...settings.overhead, items } })
                    }}
                  />
                  <input
                    type="number"
                    className={inputClass()}
                    value={item.monthly}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const items = [...settings.overhead.items]
                      items[index] = { ...item, monthly: Number(e.target.value) }
                      setSettings({ ...settings, overhead: { ...settings.overhead, items } })
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'offset' && (
        <div className="bg-white border border-brand-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-brand-ink">Тарифы офсетной печати по тиражу листов</div>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, offsetTiers: [...settings.offsetTiers, { from: 0, to: 0, price: 0 }] })
              }
              className="text-xs font-semibold text-brand-yellow-dark hover:underline"
            >
              + добавить диапазон
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {settings.offsetTiers.map((tier, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 items-center">
                <input
                  type="number"
                  className={inputClass()}
                  value={tier.from}
                  onChange={(e) => {
                    const offsetTiers = [...settings.offsetTiers]
                    offsetTiers[index] = { ...tier, from: Number(e.target.value) }
                    setSettings({ ...settings, offsetTiers })
                  }}
                />
                <input
                  type="number"
                  className={inputClass()}
                  value={tier.to}
                  onChange={(e) => {
                    const offsetTiers = [...settings.offsetTiers]
                    offsetTiers[index] = { ...tier, to: Number(e.target.value) }
                    setSettings({ ...settings, offsetTiers })
                  }}
                />
                <input
                  type="number"
                  className={inputClass()}
                  value={tier.price}
                  onChange={(e) => {
                    const offsetTiers = [...settings.offsetTiers]
                    offsetTiers[index] = { ...tier, price: Number(e.target.value) }
                    setSettings({ ...settings, offsetTiers })
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, offsetTiers: settings.offsetTiers.filter((_, i) => i !== index) })
                  }
                  className="text-brand-gray-dark hover:text-red-600 justify-self-start"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

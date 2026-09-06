import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo/logo-black.jpg'

const NAV_ITEMS = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/orders', label: 'Заказы' },
  { to: '/clients', label: 'Клиенты' },
  { to: '/materials', label: 'Склад сырья' },
  { to: '/products', label: 'Склад готовой продукции' },
  { to: '/suppliers', label: 'Поставщики' },
  { to: '/finance', label: 'Финансы' },
]

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-brand-gray">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-brand-black text-white p-5 gap-6">
        <img src={logo} alt="EnzoPack" className="w-32 rounded-lg" />
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-brand-yellow text-brand-black' : 'text-white/80 hover:bg-white/10'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between bg-brand-black text-white p-4">
          <img src={logo} alt="EnzoPack" className="h-8 rounded" />
        </header>
        <nav className="md:hidden flex overflow-x-auto gap-2 bg-white border-b border-brand-border px-4 py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  isActive ? 'bg-brand-yellow text-brand-black' : 'text-brand-ink bg-brand-gray'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}

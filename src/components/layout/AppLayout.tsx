import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../../assets/logo/logo-black.jpg'

const NAV_ITEMS = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/orders', label: 'Заказы' },
  { to: '/clients', label: 'Клиенты' },
  { to: '/materials', label: 'Склад сырья' },
  { to: '/products', label: 'Склад продукции' },
  { to: '/suppliers', label: 'Поставщики' },
  { to: '/finance', label: 'Финансы' },
]

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-gray">
      <header className="sticky top-0 z-30 bg-brand-black text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="py-4 flex items-center">
            <img src={logo} alt="EnzoPack" className="h-32 w-32 rounded-2xl object-contain" />
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto -mb-px pb-0 scrollbar-none">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3.5 py-2.5 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-brand-yellow text-white'
                      : 'border-transparent text-white/60 hover:text-white/90'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  )
}

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { IntroVideoOverlay } from './components/intro/IntroVideoOverlay'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { ClientsPage } from './pages/ClientsPage'
import { RawMaterialsPage } from './pages/RawMaterialsPage'
import { FinishedProductsPage } from './pages/FinishedProductsPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { FinancePage } from './pages/FinancePage'

export default function App() {
  return (
    <HashRouter>
      <IntroVideoOverlay />
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/materials" element={<RawMaterialsPage />} />
          <Route path="/products" element={<FinishedProductsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  )
}

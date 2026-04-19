import { Routes, Route, Navigate } from '../utils/navigation'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import DarazOAuthPage from '../pages/DarazOAuthPage'
import OrdersPage from '../pages/OrdersPage'
import DarazPage from '../pages/DarazPage'
import StockPage from '../pages/StockPage'
import CashPage from '../pages/CashPage'
import PackagingPage from '../pages/PackagingPage'
import SettingsPage from '../pages/SettingsPage'
import DeliveredOrdersPage from '../pages/DeliveredOrdersPage'
import FailedDeliveryOrdersPage from '../pages/FailedDeliveryOrdersPage'
import WeeklyReportPage from '../pages/WeeklyReportPage'
import PendingOrdersPage from '../pages/PendingOrdersPage'
import ReadyToShipOrdersPage from '../pages/ReadyToShipOrdersPage'
import ReviewsPage from '../pages/ReviewsPage'
import ProfitCalculatorPage from '../pages/ProfitCalculatorPage'
import { useAuth } from '../hooks/useAuth'
import { AppColors } from '../constants/colors'

const AppRoutes = () => {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: AppColors.bgcolor
      }}>
        <p style={{ color: AppColors.textSecondary }}>Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        backgroundColor: AppColors.bgcolor
      }}>
        <h2 style={{ color: AppColors.textPrimary }}>Error initializing app</h2>
        <p style={{ color: AppColors.red }}>{error.message}</p>
        <p style={{ fontSize: '0.875rem', color: AppColors.textSecondary }}>
          Please check your Firebase configuration.
        </p>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={user ? <Navigate href="/app/" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate href="/app/" replace /> : <SignupPage />}
      />
      <Route
        path="/daraz-oauth"
        element={user ? <DarazOAuthPage /> : <Navigate href="/app/login" replace />}
      />

      {/* Main Routes - Protected */}
      <Route
        path="/"
        element={user ? <HomePage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/orders"
        element={user ? <OrdersPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/daraz"
        element={user ? <DarazPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/stock"
        element={user ? <StockPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/cash"
        element={user ? <CashPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/packaging"
        element={user ? <PackagingPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/settings"
        element={user ? <SettingsPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/profit-calculator"
        element={user ? <ProfitCalculatorPage /> : <Navigate href="/app/login" replace />}
      />

      {/* Order Detail Routes */}
      <Route
        path="/orders/delivered"
        element={user ? <DeliveredOrdersPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/orders/failed"
        element={user ? <FailedDeliveryOrdersPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/orders/pending"
        element={user ? <PendingOrdersPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/orders/ready-to-ship"
        element={user ? <ReadyToShipOrdersPage /> : <Navigate href="/app/login" replace />}
      />
      <Route
        path="/weekly-report"
        element={user ? <WeeklyReportPage /> : <Navigate href="/app/login" replace />}
      />

      <Route path="*" element={<Navigate href="/app/" replace />} />
    </Routes>
  )
}

export default AppRoutes

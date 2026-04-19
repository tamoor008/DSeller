import { BrowserRouter as Router, useLocation } from '../utils/navigation'
import { Provider } from 'react-redux'
import { useEffect } from 'react'
import { store } from './store/store'
import { ThemeProvider } from './context/ThemeContext'
import AppRoutes from './routes/AppRoutes'
import BottomNav from './components/BottomNav'
import { useAuth } from './hooks/useAuth'
import { initializeBaseUrl } from './utils/api/baseUrl'
import { AlertProvider } from './context/AlertContext'
import './App.css'

function App() {
  useEffect(() => {
    initializeBaseUrl()
  }, [])

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AlertProvider>
          <Router>
            <AppContent />
          </Router>
        </AlertProvider>
      </ThemeProvider>
    </Provider>
  )
}



function AppContent() {
  const { user } = useAuth()
  const location = useLocation()
  const showBottomNav = user && (location.pathname === '/' || location.pathname.startsWith('/orders') || location.pathname === '/profit-calculator')

  return (
    <>
      <AppRoutes />
      {showBottomNav && <BottomNav />}
    </>
  )
}

export default App


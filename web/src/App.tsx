import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import { ThemeProvider } from './context/ThemeContext'
import AppRoutes from './routes/AppRoutes'
import BottomNav from './components/BottomNav'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
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


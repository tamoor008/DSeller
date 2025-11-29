import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/store'
import AppRoutes from './routes/AppRoutes'
import BottomNav from './components/BottomNav'
import { useAuth } from './hooks/useAuth'
import './App.css'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  )
}

function AppContent() {
  const { user } = useAuth()
  const location = useLocation()
  const showBottomNav = user && (location.pathname === '/' || location.pathname.startsWith('/orders'))

  return (
    <>
      <AppRoutes />
      {showBottomNav && <BottomNav />}
    </>
  )
}

export default App


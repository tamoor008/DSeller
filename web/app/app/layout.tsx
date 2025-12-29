'use client'

import { usePathname } from 'next/navigation'
import { Provider } from 'react-redux'
import { store } from '../../src-app/store/store'
import { ThemeProvider } from '../../src-app/context/ThemeContext'
import { useAuth } from '../../src-app/hooks/useAuth'
import BottomNav from './components/BottomNav'
import '../../src-app/index.css'

function AppContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  const showBottomNav = user && (
    pathname === '/app' || 
    pathname.startsWith('/app/orders') || 
    pathname === '/app/profit-calculator'
  )

  return (
    <>
      {children}
      {showBottomNav && <BottomNav />}
    </>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent>{children}</AppContent>
      </ThemeProvider>
    </Provider>
  )
}


'use client'

import { usePathname } from 'next/navigation'
import { Provider } from 'react-redux'
import { store } from '../../src-app/store/store'
import { ThemeProvider } from '../../src-app/context/ThemeContext'
import { useAuth } from '../../src-app/hooks/useAuth'
import Sidebar from './components/Sidebar'
import TopHeader from './components/TopHeader'
import { AppColors } from '../../src-app/constants/colors'
import '../../src-app/index.css'

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  
  // Don't show sidebar/header on login/signup pages
  const isAuthPage = pathname === '/app/login' || pathname === '/app/signup'
  const showLayout = user && !isAuthPage

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: AppColors.bgcolor
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (isAuthPage || !user) {
    return <>{children}</>
  }

  return (
    <div className="sidebar-layout" style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: AppColors.bgcolor
      }}>
        {showLayout && <Sidebar />}
        <div style={{
          marginLeft: showLayout ? '260px' : '0',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.3s ease'
        }}>
          {showLayout && <TopHeader />}
          <main style={{
            marginTop: showLayout ? '64px' : '0',
            flex: 1,
            padding: showLayout ? '32px' : '0',
            maxWidth: showLayout ? '1400px' : '100%',
            width: '100%',
            marginLeft: showLayout ? 'auto' : '0',
            marginRight: showLayout ? 'auto' : '0'
          }}>
            {children}
          </main>
        </div>
      </div>
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


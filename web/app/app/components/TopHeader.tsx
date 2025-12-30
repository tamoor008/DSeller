'use client'

import { signOut } from 'firebase/auth'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '../../../src-app/config/firebase'
import { AppColors } from '../../../src-app/constants/colors'
import { useAuth } from '../../../src-app/hooks/useAuth'

const TopHeader = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const getPageTitle = () => {
    if (pathname === '/app') return 'Dashboard'
    if (pathname === '/app/profit-calculator') return 'Profit Calculator'
    if (pathname === '/app/stock') return 'Stock Management'
    if (pathname === '/app/daraz') return 'Daraz Orders'
    if (pathname === '/app/cash') return 'Cash Management'
    if (pathname === '/app/packaging') return 'Packaging'
    if (pathname === '/app/weekly-report') return 'Weekly Report'
    if (pathname === '/app/settings') return 'Settings'
    if (pathname?.startsWith('/app/orders')) return 'Orders'
    return 'Dashboard'
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await signOut(auth)
        router.push('/app/login')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    }
  }

  return (
    <header className="top-header" style={{
        height: '64px',
        backgroundColor: AppColors.card,
        borderBottom: `1px solid ${AppColors.border}`,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: '260px',
        right: 0,
        zIndex: 90,
        transition: 'left 0.3s ease'
      }}>
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        color: AppColors.textPrimary
      }}>
        {getPageTitle()}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        {user && (
          <div style={{
            fontSize: '14px',
            color: AppColors.textSecondary
          }}>
            {user.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            color: AppColors.textSecondary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F9F9F9'
            e.currentTarget.style.color = AppColors.textPrimary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = AppColors.textSecondary
          }}
          title="Logout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default TopHeader


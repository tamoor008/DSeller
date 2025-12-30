'use client'

import { usePathname, useRouter } from 'next/navigation'
import { AppColors } from '../../../src-app/constants/colors'

const Sidebar = () => {
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems = [
    { path: '/app', label: 'Home', icon: 'home' },
    { path: '/app/profit-calculator', label: 'Calculator', icon: 'calculator' },
    { path: '/app/stock', label: 'Stock', icon: 'package' },
    { path: '/app/daraz', label: 'Daraz', icon: 'shopping-bag' },
    { path: '/app/cash', label: 'Cash', icon: 'dollar-sign' },
    { path: '/app/packaging', label: 'Packaging', icon: 'box' },
    { path: '/app/weekly-report', label: 'Weekly Report', icon: 'bar-chart' },
    { path: '/app/settings', label: 'Settings', icon: 'settings' },
  ]

  const isActive = (path: string) => {
    if (path === '/app') {
      return pathname === '/app'
    }
    return pathname.startsWith(path)
  }

  const getIcon = (icon: string, active: boolean) => {
    const color = active ? AppColors.primaryOrange : AppColors.textSecondary
    const fill = active ? AppColors.primaryOrange : 'none'

    switch (icon) {
      case 'home':
        return (
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )
      case 'calculator':
        return (
          <path d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 4v2h2V6H7zm0 4v2h2v-2H7zm0 4v2h2v-2H7zm4-8v2h8V6h-8zm0 4v2h8v-2h-8zm0 4v2h8v-2h-8z" fill={fill} stroke={color} strokeWidth="2" />
        )
      case 'package':
        return (
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )
      case 'shopping-bag':
        return (
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )
      case 'dollar-sign':
        return (
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )
      case 'box':
        return (
          <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.78 0l-8-4a2 2 0 0 1-1.11-1.8V7.24a2 2 0 0 1 1.11-1.81l8-4a2 2 0 0 1 1.78 0z" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )
      case 'bar-chart':
        return (
          <path d="M12 20V10M18 20V4M6 20v-4" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )
      case 'settings':
        return (
          <>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill={fill} stroke={color} strokeWidth="2" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" fill={fill} stroke={color} strokeWidth="2" />
          </>
        )
      default:
        return null
    }
  }

  return (
    <aside style={{
        width: '260px',
        height: '100vh',
        backgroundColor: AppColors.card,
        borderRight: `1px solid ${AppColors.border}`,
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100
      }}>
      {/* Logo/Brand */}
      <div style={{
        padding: '0 24px 32px 24px',
        borderBottom: `1px solid ${AppColors.border}`,
        marginBottom: '24px'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          color: AppColors.primaryOrange,
          letterSpacing: '-0.02em'
        }}>
          DSeller
        </div>
        <div style={{
          fontSize: '12px',
          color: AppColors.textSecondary,
          marginTop: '4px'
        }}>
          Daraz Seller Toolkit
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '0 12px',
        overflowY: 'auto'
      }}>
        {navigationItems.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '4px',
                background: active ? '#FFF4F0' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: active ? AppColors.primaryOrange : AppColors.textPrimary,
                fontSize: '14px',
                fontWeight: active ? 600 : 500
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#F9F9F9'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                {getIcon(item.icon, active)}
              </svg>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar


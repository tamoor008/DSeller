import { useNavigate, useLocation } from 'react-router-dom'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/orders', label: 'Orders', icon: 'list' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: AppColors.card,
      borderTop: `1px solid ${AppColors.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0',
      zIndex: 1000,
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
    }}>
      {tabs.map((tab) => {
        const active = isActive(tab.path)
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              color: active ? AppColors.primaryOrange : AppColors.textSecondary,
              fontSize: '12px',
              fontWeight: active ? 600 : 500
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={active ? AppColors.primaryOrange : 'none'}
              stroke={active ? AppColors.primaryOrange : AppColors.textSecondary}
              strokeWidth="2"
            >
              {tab.icon === 'home' ? (
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              ) : (
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              )}
            </svg>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav


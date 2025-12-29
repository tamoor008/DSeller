import { useNavigate, useLocation } from '../utils/navigation'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/orders', label: 'Orders', icon: 'list' },
    { path: '/profit-calculator', label: 'Calculator', icon: 'calculator' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    if (path === '/profit-calculator') {
      return location.pathname === '/profit-calculator'
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
      padding: '12px 0 calc(12px + env(safe-area-inset-bottom))',
      zIndex: 1000,
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
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
              padding: '8px 20px',
              color: active ? AppColors.primaryOrange : AppColors.textSecondary,
              fontSize: '12px',
              fontWeight: active ? 600 : 500,
              transition: 'all 0.2s ease',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = '#FFF4F0'
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
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
              ) : tab.icon === 'calculator' ? (
                <path d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 4v2h2V6H7zm0 4v2h2v-2H7zm0 4v2h2v-2H7zm4-8v2h8V6h-8zm0 4v2h8v-2h-8zm0 4v2h8v-2h-8z" />
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



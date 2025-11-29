import React from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

interface HomeHeaderProps {
  onOpenSettings?: () => void
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onOpenSettings }) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await signOut(auth)
        navigate('/login')
      } catch (error) {
        console.error('Error signing out:', error)
      }
    }
  }

  const handleSettings = () => {
    if (onOpenSettings) {
      onOpenSettings()
    } else {
      navigate('/settings')
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      justifyContent: 'space-between'
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 700,
        color: AppColors.primaryOrange
      }}>
        {AppStrings.dseller}
      </div>
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <button
          onClick={handleSettings}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            color: AppColors.primaryOrange,
            padding: 0
          }}
        >
          {AppStrings.settings}
        </button>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default HomeHeader


import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppColors } from '../constants/colors'
import InfoModal from './InfoModal'

interface HeaderProps {
  goBack?: () => void
  info?: string
  title: string
}

const Header: React.FC<HeaderProps> = ({ goBack, info, title }) => {
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (goBack) {
      goBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: '8px'
      }}>
        {goBack !== undefined && (
          <button
            onClick={handleGoBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={AppColors.textPrimary} strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h2 style={{
          flex: 1,
          margin: 0,
          fontSize: '20px',
          fontWeight: 400,
          color: AppColors.textPrimary
        }}>
          {title}
        </h2>
        {info && (
          <button
            onClick={() => setIsVisible(true)}
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
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        )}
      </div>
      {isVisible && info && (
        <InfoModal setIsVisible={setIsVisible} info={info} />
      )}
    </>
  )
}

export default Header


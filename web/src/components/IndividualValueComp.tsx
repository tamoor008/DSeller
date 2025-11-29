import React, { useState } from 'react'
import { AppColors } from '../constants/colors'
import InfoModal from './InfoModal'

interface IndividualValueCompProps {
  amount: number
  label: string
  onPress?: () => void
  info?: string
  loader?: boolean
}

const IndividualValueComp: React.FC<IndividualValueCompProps> = ({
  amount,
  label,
  onPress,
  info,
  loader
}) => {
  const [isVisible, setIsVisible] = useState(false)

  if (loader) {
    return (
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '8px',
        padding: '16px',
        minHeight: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: `3px solid ${AppColors.primaryOrange}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <>
      <div
        style={{
          backgroundColor: AppColors.card,
          borderRadius: '8px',
          padding: '16px',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onPress ? 'pointer' : 'default'
        }}
        onClick={onPress}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 400,
              color: AppColors.textSecondary
            }}>
              Rs
            </span>
            <span style={{
              fontSize: '20px',
              fontWeight: 700,
              color: AppColors.textPrimary
            }}>
              {Math.floor(amount).toLocaleString()}
            </span>
          </div>
          {info && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsVisible(true)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={AppColors.textSecondary} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </button>
          )}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 500,
            color: AppColors.textSecondary
          }}>
            {label}
          </span>
          {onPress && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={AppColors.textSecondary} strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
      {isVisible && info && (
        <InfoModal setIsVisible={setIsVisible} info={info} />
      )}
    </>
  )
}

export default IndividualValueComp


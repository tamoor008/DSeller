import React, { useState } from 'react'
import { AppColors } from '../constants/colors'
import InfoModal from './InfoModal'

interface IndividualDataCompProps {
  data: number
  label: string
  onPress?: () => void
  info?: string
  loader?: boolean
}

const IndividualDataComp: React.FC<IndividualDataCompProps> = ({
  data,
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
        borderRadius: '12px',
        padding: '20px',
        minHeight: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${AppColors.border}`
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
          borderRadius: '12px',
          padding: '20px',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: onPress ? 'pointer' : 'default',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
          border: `1px solid ${AppColors.border}`
        }}
        onClick={onPress}
        onMouseEnter={(e) => {
          if (onPress) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }
        }}
        onMouseLeave={(e) => {
          if (onPress) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <span style={{
            fontSize: '20px',
            fontWeight: 700,
            color: AppColors.textPrimary
          }}>
            {Math.floor(data)}
          </span>
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

export default IndividualDataComp




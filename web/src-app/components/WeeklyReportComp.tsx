import React from 'react'
import { AppColors } from '../constants/colors'

interface WeeklyReportCompProps {
  onPress?: () => void
  text: string
}

const WeeklyReportComp: React.FC<WeeklyReportCompProps> = ({ onPress, text }) => {
  return (
    <div
      style={{
        backgroundColor: AppColors.card,
        borderRadius: '12px',
        padding: '16px',
        cursor: onPress ? 'pointer' : 'default',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        border: `1px solid ${AppColors.border}`,
        transition: 'all 0.2s ease'
      }}
      onClick={onPress}
      onMouseEnter={(e) => {
        if (onPress) {
          e.currentTarget.style.transform = 'translateY(-1px)'
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
      <span style={{
        fontSize: '14px',
        fontWeight: 500,
        color: AppColors.textPrimary
      }}>
        {text}
      </span>
      {onPress && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={AppColors.textSecondary} strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
}

export default WeeklyReportComp




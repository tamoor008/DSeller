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
        borderRadius: '8px',
        padding: '16px',
        cursor: onPress ? 'pointer' : 'default',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
      onClick={onPress}
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


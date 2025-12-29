import React from 'react'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

interface TotalBusinessCompProps {
  businessValue: string
}

const TotalBusinessComp: React.FC<TotalBusinessCompProps> = ({ businessValue }) => {
  return (
    <div style={{
      backgroundColor: AppColors.primaryOrange,
      background: `linear-gradient(135deg, ${AppColors.primaryOrange} 0%, #FF6B2B 100%)`,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      padding: '24px',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 4px 6px -1px rgba(248, 86, 6, 0.3), 0 2px 4px -1px rgba(248, 86, 6, 0.2)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{
          fontSize: '16px',
          fontWeight: 400,
          color: AppColors.white
        }}>
          {AppStrings.symbol.rs}
        </span>
        <span style={{
          fontSize: '24px',
          fontWeight: 700,
          color: AppColors.white
        }}>
          {businessValue}
        </span>
      </div>
      <span style={{
        fontSize: '16px',
        fontWeight: 500,
        color: AppColors.white50
      }}>
        {AppStrings.totalbusiness}
      </span>
    </div>
  )
}

export default TotalBusinessComp




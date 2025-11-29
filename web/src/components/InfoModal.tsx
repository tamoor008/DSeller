import React from 'react'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

interface InfoModalProps {
  setIsVisible: (visible: boolean) => void
  info: string
}

const InfoModal: React.FC<InfoModalProps> = ({ setIsVisible, info }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={() => setIsVisible(false)}
    >
      <div
        style={{
          backgroundColor: AppColors.card,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: AppColors.textPrimary
          }}>
            {AppStrings.info}
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: AppColors.textSecondary,
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        <p style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: '1.6',
          color: AppColors.textSecondary
        }}>
          {info}
        </p>
      </div>
    </div>
  )
}

export default InfoModal


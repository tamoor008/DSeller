import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const SettingsPage = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px'
    }}>
      <Header title={AppStrings.settings} goBack={() => navigate(-1)} />
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '8px',
        padding: '2rem',
        marginTop: '16px'
      }}>
        <h3 style={{
          margin: 0,
          marginBottom: '1rem',
          color: AppColors.textPrimary,
          fontSize: '18px',
          fontWeight: 600
        }}>
          {AppStrings.appearance}
        </h3>
        <p style={{
          margin: 0,
          color: AppColors.textSecondary,
          fontSize: '14px',
          marginBottom: '1rem'
        }}>
          {AppStrings.themeDescription}
        </p>
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            style={{
              backgroundColor: AppColors.primaryOrange,
              color: AppColors.white,
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {AppStrings.lightTheme}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage


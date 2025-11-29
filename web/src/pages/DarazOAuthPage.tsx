import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const DarazOAuthPage = () => {
  const navigate = useNavigate()
  const [authUrl, setAuthUrl] = useState('')

  useEffect(() => {
    const CLIENT_ID = '503646'
    const REDIRECT_URI = window.location.origin + '/daraz-oauth'
    const url = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`
    setAuthUrl(url)
  }, [])

  const handleAuthorize = () => {
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor,
      padding: '16px'
    }}>
      <Header title="Connect Daraz Store" goBack={() => navigate(-1)} />
      <div style={{
        backgroundColor: AppColors.card,
        borderRadius: '8px',
        padding: '2rem',
        marginTop: '16px',
        textAlign: 'center'
      }}>
        <p style={{
          marginBottom: '1.5rem',
          color: AppColors.textSecondary
        }}>
          Connect your Daraz store to start managing orders and inventory
        </p>
        <button
          onClick={handleAuthorize}
          style={{
            backgroundColor: AppColors.primaryOrange,
            color: AppColors.white,
            border: 'none',
            borderRadius: '4px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Authorize Daraz Store
        </button>
      </div>
    </div>
  )
}

export default DarazOAuthPage


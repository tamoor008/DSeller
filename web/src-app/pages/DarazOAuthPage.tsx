import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from '../utils/navigation'
import Header from '../components/Header'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'
import { getBaseUrl } from '../utils/api/baseUrl'

const DarazOAuthPage = () => {
  const navigate = useNavigate()
  const searchParams = useSearchParams()
  const [authUrl, setAuthUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOAuthCallback = useCallback(async (code: string) => {
    setLoading(true)
    setError('')
    
    try {
      const BASE_URL = getBaseUrl()
      const response = await fetch(`${BASE_URL}/get-daraz-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Success - redirect to home or stores page
      navigate('/app')
    } catch (err: any) {
      console.error('Error getting Daraz token:', err)
      setError(err.message || 'Failed to authenticate with Daraz. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  // Handle OAuth callback
  useEffect(() => {
    if (!searchParams) return
    
    const code = searchParams.get('code')
    if (code) {
      handleOAuthCallback(code)
    } else {
      // Set up auth URL if no code parameter
      const CLIENT_ID = '503646'
      // Use the registered redirect URI (same as mobile app)
      // For local development, you may need to register localhost in Daraz app settings
      const REDIRECT_URI = 'https://www.moonsys.co/daraz-oauth'
      const url = `https://api.daraz.pk/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}`
      setAuthUrl(url)
    }
  }, [searchParams, handleOAuthCallback])

  const handleAuthorize = () => {
    if (authUrl) {
      window.location.href = authUrl
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: AppColors.bgcolor,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: AppColors.textPrimary, marginBottom: '1rem' }}>
            Connecting your Daraz store...
          </p>
        </div>
      </div>
    )
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
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}
        <p style={{
          marginBottom: '1.5rem',
          color: AppColors.textSecondary
        }}>
          Connect your Daraz store to start managing orders and inventory
        </p>
        <button
          onClick={handleAuthorize}
          disabled={!authUrl}
          style={{
            backgroundColor: AppColors.primaryOrange,
            color: AppColors.white,
            border: 'none',
            borderRadius: '4px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 500,
            cursor: authUrl ? 'pointer' : 'not-allowed',
            opacity: authUrl ? 1 : 0.6
          }}
        >
          Authorize Daraz Store
        </button>
      </div>
    </div>
  )
}

export default DarazOAuthPage







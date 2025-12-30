import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useNavigate, Link } from '../utils/navigation'
import { auth } from '../config/firebase'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const LoginPage = () => {
  const [email, setEmail] = useState('tam@gmail.com')
  const [password, setPassword] = useState('12345678')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/app')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: AppColors.bgcolor
    }}>
      <div style={{
        backgroundColor: AppColors.card,
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '420px',
        border: `1px solid ${AppColors.border}`
      }}>
        <h1 style={{ 
          marginBottom: '1.5rem', 
          textAlign: 'center',
          color: AppColors.textPrimary,
          fontSize: '2rem'
        }}>
          DSeller
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: AppColors.textPrimary,
                fontWeight: 500
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${AppColors.border}`,
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: AppColors.white,
                color: AppColors.textPrimary,
                transition: 'all 0.2s ease'
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                color: AppColors.textPrimary,
                fontWeight: 500
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${AppColors.border}`,
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: AppColors.white,
                color: AppColors.textPrimary,
                transition: 'all 0.2s ease'
              }}
            />
          </div>
          {error && (
            <div style={{
              color: AppColors.red,
              marginBottom: '1rem',
              fontSize: '0.875rem',
              padding: '0.5rem',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: AppColors.primaryOrange,
              color: AppColors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(248, 86, 6, 0.3), 0 2px 4px -1px rgba(248, 86, 6, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: AppColors.textSecondary
        }}>
          {AppStrings.donthaveanaccount}{' '}
          <Link href="/app/signup" style={{ color: AppColors.primaryOrange, textDecoration: 'none' }}>
            {AppStrings.signup}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage


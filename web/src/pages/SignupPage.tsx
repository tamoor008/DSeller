import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useNavigate, Link } from 'react-router-dom'
import { auth } from '../config/firebase'
import { AppColors } from '../constants/colors'
import { AppStrings } from '../constants/strings'

const SignupPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
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
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          marginBottom: '1.5rem', 
          textAlign: 'center',
          color: AppColors.textPrimary,
          fontSize: '2rem'
        }}>
          {AppStrings.dseller}
        </h1>
        <p style={{
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: AppColors.textSecondary,
          fontSize: '14px'
        }}>
          {AppStrings.letscreateyourprofile}
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="fullName" style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: AppColors.textPrimary,
              fontWeight: 500
            }}>
              {AppStrings.fullname}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${AppColors.border}`,
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: AppColors.white,
                color: AppColors.textPrimary
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: AppColors.textPrimary,
              fontWeight: 500
            }}>
              {AppStrings.email}
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
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: AppColors.white,
                color: AppColors.textPrimary
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: AppColors.textPrimary,
              fontWeight: 500
            }}>
              {AppStrings.password}
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
                borderRadius: '4px',
                fontSize: '1rem',
                backgroundColor: AppColors.white,
                color: AppColors.textPrimary
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
              padding: '0.75rem',
              backgroundColor: AppColors.primaryOrange,
              color: AppColors.white,
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontWeight: 500
            }}
          >
            {loading ? 'Creating account...' : AppStrings.signup}
          </button>
        </form>
        <p style={{
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: AppColors.textSecondary
        }}>
          {AppStrings.alreadyhaveanaccount}{' '}
          <Link to="/login" style={{ color: AppColors.primaryOrange, textDecoration: 'none' }}>
            {AppStrings.signin}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage


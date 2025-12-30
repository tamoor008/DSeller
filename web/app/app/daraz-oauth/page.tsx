'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../src-app/hooks/useAuth'
import DarazOAuthPage from '../../../src-app/pages/DarazOAuthPage'

export default function DarazOAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/app/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#F9F9F9'
      }}>
        <p style={{ color: '#5C5C5C' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DarazOAuthPage />
}





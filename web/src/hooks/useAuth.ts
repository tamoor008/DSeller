import { useState, useEffect } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../config/firebase'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!auth) {
      setError(new Error('Firebase auth is not initialized'))
      setLoading(false)
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setUser(user)
          setLoading(false)
          setError(null)
        },
        (error) => {
          console.error('Auth state change error:', error)
          setError(error)
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up auth listener:', err)
      setError(err as Error)
      setLoading(false)
    }
  }, [])

  return { user, loading, error }
}


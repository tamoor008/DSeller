import { getDatabase, ref, get, onValue, DataSnapshot } from 'firebase/database'
import app from '../../config/firebase'

const FALLBACK_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'

let BASE_URL = FALLBACK_BASE_URL
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * Initializes the base URL by fetching it from Firebase Realtime Database
 */
export const initializeBaseUrl = async (): Promise<void> => {
  if (initializationPromise) return initializationPromise
  if (isInitialized) return Promise.resolve()

  initializationPromise = (async () => {
    try {
      const database = getDatabase(app)
      const baseUrlRef = ref(database, 'Base_URL')

      // Initial fetch
      const snapshot = await get(baseUrlRef)
      if (snapshot.exists()) {
        BASE_URL = snapshot.val()
      }

      // Set up real-time listener
      onValue(baseUrlRef, (snapshot) => {
        if (snapshot.exists()) {
          const newUrl = snapshot.val()
          if (newUrl !== BASE_URL) {
            BASE_URL = newUrl
          }
        }
      })

      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Base URL from Firebase:', error)
      BASE_URL = FALLBACK_BASE_URL
      isInitialized = true
    }
  })()

  return initializationPromise
}

export const getBaseUrl = (): string => {
  return BASE_URL || FALLBACK_BASE_URL
}

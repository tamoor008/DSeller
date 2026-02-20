import { getDatabase, ref, get, onValue, DataSnapshot } from 'firebase/database'
import app from '../../config/firebase'

let BASE_URL = ''

// Initialize and fetch base URL from Firebase Realtime Database
export const initializeBaseUrl = async () => {
  try {
    const database = getDatabase(app)
    const baseUrlRef = ref(database, 'Base_URL')

    console.log('🔍 [BASE_URL] Fetching from Firebase Realtime Database...')
    const snapshot = await get(baseUrlRef)

    if (snapshot.exists()) {
      BASE_URL = snapshot.val()
      console.log('✅ [BASE_URL] Fetched from Firebase:', BASE_URL)
    } else {
      console.warn('⚠️ [BASE_URL] Base_URL not found in Firebase')
    }

    // Set up real-time listener
    onValue(baseUrlRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const newUrl = snapshot.val()
        if (newUrl !== BASE_URL) {
          BASE_URL = newUrl
          console.log('🔄 [BASE_URL] Updated from Firebase:', BASE_URL)
        }
      }
    })

  } catch (error) {
    console.error('❌ [BASE_URL] Failed to fetch from Firebase:', error)
  }
}

export const getBaseUrl = () => {
  return BASE_URL
}




